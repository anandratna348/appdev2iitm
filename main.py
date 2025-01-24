import io
import csv
from flask import send_file
from flask import Flask, request, jsonify, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from models import db, User, Role, Service, ProfessionalProfile, ServiceRequest, ProfessionalProfile, CustomerProfile
from functools import wraps
from datetime import datetime
from sqlalchemy import func
import config
from flask_mail import Mail, Message
from auth_utils import set_password, check_password
from celery import Celery
import calendar
from celery.schedules import crontab


app = Flask(__name__)
app.config.from_object(config.DevelopmentConfig)
app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'abcd@gmail.com'
app.config['MAIL_PASSWORD'] = 'xxxx xxxx xxxx xxxx'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

db.init_app(app)

# Initialize JWT
jwt = JWTManager(app)
mail = Mail(app)
blacklist = set()

app.config['broker_url'] = 'redis://localhost:6379/0'
app.config['result_backend'] = 'redis://localhost:6379/0'

# Celery app initialization
cel_app = Celery(app.name, broker=app.config['broker_url'])
cel_app.conf.update(app.config)
cel_app.conf.update(
    task_pool='solo',
)



from celery.schedules import crontab

cel_app.conf.beat_schedule = {
    'send-unaddressed-requests-email': {
        'task': 'send_unaddressed_requests_email',  # Task name
        'schedule': crontab(hour=18, minute=0),  # Execute every day at 6:00 PM
    },
}

cel_app.conf.timezone = 'Asia/Kolkata'   # Adjust as per your timezone


#-------------------------------------------------------------Tasks------------------------------------------------------------------------------

@cel_app.task(name='send_unaddressed_requests_email')
def send_unaddressed_requests_email():
    # Provide the Flask application context
    with app.app_context():
        # Get current date
        today = datetime.now()

        # Find all unaddressed service requests (status=None) in the past day
        unaddressed_requests = ServiceRequest.query.filter_by(service_status="requested").all()

        # Group requests by professional
        requests_by_professional = {}
        for request in unaddressed_requests:
            professional = ProfessionalProfile.query.get(request.professional_id)
            user = User.query.filter_by(id=professional.user_id).first()
            professional_email = user.email
            if professional and professional_email:
                if professional.id not in requests_by_professional:
                    requests_by_professional[professional.id] = {
                        "email": professional_email,
                        "name": professional.name,
                        "requests": []
                    }
                requests_by_professional[professional.id]["requests"].append(request)

        # Send emails to professionals
        for prof_id, details in requests_by_professional.items():
            email_body = f"Dear {details['name']},\n\nYou have pending service requests:\n\n"
            for req in details["requests"]:
                email_body += f"- Service: {req.service_name}, Requested by: {req.customer_name}, Pincode: {req.pincode}\n"

            email_body += "\nPlease log in to your dashboard to respond.\n\nBest regards,\nYour Service Platform"

            # Send the email
            try:
                msg = Message(
                    subject="Pending Service Requests",
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[details["email"]]
                )
                msg.body = email_body
                mail.send(msg)
            except Exception as e:
                print(f"Failed to send email to {details['email']}: {str(e)}")

@cel_app.task
def send_monthly_reports():
    # Get current month and year
    now = datetime.now()
    month = now.month
    year = now.year
    month_name = calendar.month_name[month]
    
    # Get all customers and professionals
    customers = db.session.query(CustomerProfile).all()
    professionals = db.session.query(ProfessionalProfile).all()

    # Generate customer email reports
    for customer in customers:
        service_requests = db.session.query(ServiceRequest).filter(
            ServiceRequest.customer_id == customer.id,
            ServiceRequest.date_of_request >= datetime(year, month, 1),
            ServiceRequest.date_of_request < datetime(year, month + 1, 1)
        ).all()
        user = User.query.filter_by(id=customer.user_id).first()
        completed_requests = [sr for sr in service_requests if sr.service_status == 'completed']
        
        if service_requests:
            # Create the HTML content for the customer email
            customer_report = render_template('customer_report.html', 
                                              customer=customer, 
                                              completed_requests=completed_requests,
                                              month=month_name, year=year)

            # Send the email
            msg = Message(f"Your Service Report for {month_name} {year}",
                          sender='abcd@gmail.com', 
                          recipients=[user.email])
            msg.html = customer_report
            mail.send(msg)

    # Generate professional email reports
    for professional in professionals:
        completed_requests = db.session.query(ServiceRequest).filter(
            ServiceRequest.professional_id == professional.id,
            ServiceRequest.date_of_completion >= datetime(year, month, 1),
            ServiceRequest.date_of_completion < datetime(year, month + 1, 1),
            ServiceRequest.service_status == 'completed'
        ).all()
        users = User.query.filter_by(id=customer.user_id).first()
        if completed_requests:
            # Create the HTML content for the professional email
            professional_report = render_template('professional_report.html',
                                                  professional=professional,
                                                  completed_requests=completed_requests,
                                                  month=month_name, year=year)

            # Send the email
            msg = Message(f"Your Work Report for {month_name} {year}",
                          sender='your_email@gmail.com',
                          recipients=[users.email])
            msg.html = professional_report
            mail.send(msg)

    return "Monthly reports sent successfully!"



#-------------------------------------------------------------------------------------
def role_required(role):
    def wrapper(fn):
        @wraps(fn)
        def decorated_function(*args, **kwargs):
            # Get current user identity from JWT
            identity = get_jwt_identity()
            user_role = identity.get("role") if identity else None

            if user_role != role:
                return jsonify({"message": "Access denied: Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorated_function
    return wrapper

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role_name = data.get('role')

    if not email or not password or not role_name:
        return jsonify({"error": "Missing required fields: email, password, or role"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": f"Role '{role_name}' does not exist"}), 400
    hashed_password = set_password(password)
    user = User(
        email=email,
        password=hashed_password,
        fs_uniquifier=email
    )
    user.roles.append(role)
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/role', methods=['POST'])
def roles():
    data = request.json
    name = data.get('name')
    description = data.get('description')
    add_role = Role(name=name, description=description)
    db.session.add(add_role)
    db.session.commit()
    return jsonify({"message": "Role registered"})

@app.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"error": "Request content type must be application/json"}), 415

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Fetch user from the database
    user = User.query.filter_by(email=email).first()
    if user and check_password(user.password, password):
        # Extract the role as a string
        role = user.roles[0].name if user.roles else "unknown"

        # Check active status for professional and customer roles
        if role == 'professional':
            # Fetch the related ProfessionalProfile and check active status
            if not user.active:
                return jsonify({"error": "Customer account is inactive"}), 403

        elif role == 'customer':
            # Fetch active status directly from the User model for customers
            if not user.active:
                return jsonify({"error": "Customer account is inactive"}), 403
        

        # Create identity including user ID and role
        identity = {
            "id": user.id,
            "role": role
        }

        # Generate access token
        access_token = create_access_token(identity=identity)

        # Return the response based on the role
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "role": role
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

    
@app.route('/admin_dashboard')
@jwt_required()
@role_required('admin')
def admin_dashboard():
    return jsonify({"message": "Welcome to Admin Dashboard"})


@app.route('/professional_dashboard')
@jwt_required()
@role_required('professional')
def professional_dashboard():
    id = get_jwt_identity()['id']
    ratings=ProfessionalProfile.query.filter_by(user_id=id).first()
    return jsonify({
        'rating': ratings.rating
    }), 200


@app.route('/customer_dashboard')
@jwt_required()
@role_required('customer')
def customer_dashboard():
    return jsonify({"message": "Welcome to Customer Dashboard"})
    
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({
        "message": "Access granted",
        "user": current_user
    }), 200


@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logs out the user by blacklisting their JWT token.
    """
    jti = get_jwt()["jti"]  # Get the unique identifier for the JWT token
    blacklist.add(jti)  # Add the token identifier to the blacklist
    return jsonify({"message": "Logout successful"}), 200

# Add this function to check blacklisted tokenst:id>
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return jti in blacklist

#------------------------------------------------------admin panel-----------------------------------------------------------------------------



@app.route('/admin_dashboard/services', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_services():
    services = Service.query.all()
    return jsonify([{
        "id": req.id,
        "name": req.name,
        "description": req.description,
        "time_required": req.time_required,
        "price": req.price,
    } for req in services]), 200

@app.route('/admin_dashboard/add_services', methods=['POST'])
@jwt_required()
@role_required('admin')
def add_service():
    data = request.get_json()
    new_service = Service(
        name=data['name'],
        description=data['description'],
        time_required=data['time_required'],
        price=data['price']
    )
    db.session.add(new_service)
    db.session.commit()
    return jsonify({'message': 'Service added successfully'}), 201

@app.route('/admin_dashboard/update_service/<int:id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_service(id):
    data = request.get_json()
    service = Service.query.filter_by(id=id).first()
    service.name = data['name']
    service.description = data['description']
    service.time_required = data['time_required']
    service.price = data['price']
    db.session.commit()
    return jsonify({'message': 'Service updated successfully'}), 200

@app.route('/admin_dashboard/delete_service/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_service(id):
    service = Service.query.filter_by(id=id).first()
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Service deleted successfully'}), 200

@app.route('/admin_dashboard/view_customers', methods=['GET'])  # Corrected typo in route
@jwt_required()
@role_required('admin')
def customers():
    try:
        # Fetch all customer profiles
        customer_profiles = CustomerProfile.query.all()

        # Prepare response data
        customer_data = [{
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "address": customer.address,
            "active": customer.active,
        } for customer in customer_profiles]

        return jsonify(customer_data), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/admin_dashboard/view_customers/services/<int:id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def CustomersServices(id):
    # Fetch the service requests for the logged-in customer
    service_history = ServiceRequest.query.filter_by(customer_id=id).all()

    # Return the service history data
    if service_history:
        history_data = [
            {   
                'customer_name': entry.customer_name,
                'professional_name': entry.professional_name,
                "service_name": entry.service_name,
                'price_per_hour': entry.hourly_rate,  # Assuming this is part of ServiceRequest
                'date_of_request': entry.date_of_request.strftime('%Y-%m-%d %H:%M:%S'),
                'date_of_completion': entry.date_of_completion.strftime('%Y-%m-%d %H:%M:%S') if entry.date_of_completion else None,
                'total_hour': entry.hours_worked,  # Assuming this is part of ServiceRequest
                'total_price': entry.total_price,  # Assuming this is part of ServiceRequest
                'ratings': entry.rating if entry.rating else None,  # Rating after completion
                'status': entry.service_status,
            }
            for entry in service_history
        ]
        return jsonify(history_data), 200
    else:
        return jsonify({"message": "No service history found."}), 404


@app.route('/admin_dashboard/manage_professional', methods=['GET'])
@jwt_required()
@role_required('admin')
def manageprofessional():
    professionals = ProfessionalProfile.query.all()
    professional_list = [{
        "id": req.id,
        "name": req.name,
        "service_name": req.service_type,
        "rating": req.rating,
        "phone": req.phone,
        "experience": req.experience,
        "date_created": req.date_created.strftime('%Y-%m-%d'),  # Format date for JSON
        "status": 'active' if req.active else 'inactive'
    } for req in professionals]
    return jsonify(professional_list), 200


   
@app.route('/admin_dashboard/professionals/<int:professional_id>/status', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def toggle_professional_status(professional_id):
    data = request.json
    active_status = data.get('active')

    # Fetch professional profile
    professional = ProfessionalProfile.query.filter_by(id=professional_id).first()
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    # Update the active status in ProfessionalProfile
    professional.active = active_status

    # Update the active status in the associated User table
    user = User.query.filter_by(id=professional.user_id).first()
    if user:
        user.active = active_status

    try:
        db.session.commit()
        return jsonify({"message": "Professional status updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
@app.route('/admin_dashboard/customer/<int:customer_id>/status', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def toggle_customer_status(customer_id):
    data = request.get_json()
    active_status = data.get('active')

    if active_status is None:
        return jsonify({"error": "Invalid input. 'active' field is required."}), 400

    # Fetch the CustomerProfile
    customer = CustomerProfile.query.filter_by(id=customer_id).first()
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # Update the active status in CustomerProfile
    customer.active = active_status

    # Update the active status in the associated User table
    user = User.query.filter_by(id=customer.user_id).first()
    if user:
        user.active = active_status

    try:
        db.session.commit()
        return jsonify({"message": "Customer status updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/admin_dashboard/manage_professional/services/<int:professional_id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_professional_history(professional_id):
    service_requests = ServiceRequest.query.filter_by(professional_id=professional_id).all()
    if not service_requests:
        return jsonify({"message": "No service history found for this professional."}), 404

    history = [{
        "customer_name": req.customer_name,
        "professional_name": req.professional_name,
        "service_name": req.service_name,
        "rating": req.rating,
        "hourly_rate": req.hourly_rate,
        "hours_worked": req.hours_worked,
        "total_price": req.total_price,
        "date_of_request": req.date_of_request.strftime('%Y-%m-%d'),
        "date_of_completion": req.date_of_completion.strftime('%Y-%m-%d') if req.date_of_completion else None,
    } for req in service_requests]

    return jsonify(history), 200



# Route for service frequency (Bar Graph Data)
@app.route('/admin_dashboard/service_frequency', methods=['GET'])
@jwt_required()
def get_service_frequency():
    # Query to get the frequency of each service requested from the ServiceRequest table
    services = db.session.query(ServiceRequest.service_name, func.count(ServiceRequest.id).label('count')) \
                         .group_by(ServiceRequest.service_name).all()

    # Prepare the response in the format required by the frontend
    service_data = [{'service_name': service.service_name, 'count': service.count} for service in services]
    
    return jsonify(service_data)

# Route for completed and pending requests (Bar Graph Data)
@app.route('/admin/dashboard/completed_requests', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_completed_requests():
    # Query to count the completed requests
    completed_requests = ServiceRequest.query.filter_by(service_status='completed').count()
    pending_requests = ServiceRequest.query.filter_by(service_status='pending').count()

    completed_data = [
        {'status': 'Completed', 'count': completed_requests},
        {'status': 'Pending', 'count': pending_requests}
    ]
    
    return jsonify(completed_data)




@app.route('/admin/export-closed-requests', methods=['POST'])
@jwt_required()
@role_required('admin')
def export_closed_request():
    closed_requests = db.session.query(ServiceRequest).filter(ServiceRequest.service_status == 'completed').all()
    if not closed_requests:
        return jsonify({"message": "No closed requests to export."}), 404
    output = io.BytesIO()
    writer = csv.writer(io.TextIOWrapper(output, 'utf-8', newline=''), quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(['Service ID', 'Customer Name', 'Professional Name', 'Date of Request', 'Date of Completion', 'Total Hours Worked', 'Total Amount', 'Rating', 'Hourly Rate', 'Remarks', 'Pincode', 'Service Name'])
    
    for request in closed_requests:
        writer.writerow([
            request.id,
            request.customer_name,
            request.professional_name,
            request.date_of_request.strftime('%Y-%m-%d %H:%M:%S'),
            request.date_of_completion.strftime('%Y-%m-%d %H:%M:%S') if request.date_of_completion else 'N/A',
            request.hours_worked if request.hours_worked else 'N/A',
            request.total_price if request.total_price else 'N/A',
            request.rating if request.rating else 'NA',
            request.hourly_rate,
            request.remarks if request.remarks else 'NA',
            request.pincode,
            request.service_name,
        ])
    output.seek(0)
    return send_file(output, mimetype='text/csv', as_attachment=True, download_name='closed_requests.csv')


    
#------------------------------------------------------------End Admin Panle---------------------------------------------------------------------------------

#------------------------------------------------------------Professional Panle---------------------------------------------------------------------------

@app.route('/professional_dashboard/create_update_profile', methods=['POST'])
@jwt_required()
@role_required('professional')
def create_profile():
    current_user = get_jwt_identity()['id'] # Identity should include 'id'
    user = User.query.filter_by(id=current_user).first()

    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    service_type = data.get('service_type')
    experience = data.get('experience')
    pincode = data.get('pincode')

    # Check if user has "professional" role
    if not any(role.name == "professional" for role in user.roles):
        return jsonify({"error": "You do not have the required role to create a professional profile"}), 403

    # Validate service_type against available services
    available_services = [service.name for service in Service.query.all()]
    if service_type and service_type not in available_services:
        return jsonify({"error": "Invalid service type selected"}), 400

    # Check if a profile already exists
    profile = ProfessionalProfile.query.filter_by(user_id=current_user).first()
    if profile:
        # Update the existing profile
        if name:
            profile.name = name
        if phone:
            profile.phone = phone
        if service_type:
            profile.service_type = service_type
        if experience is not None:
            profile.experience = experience
        if pincode:
            profile.pincode = pincode
        try:
            db.session.commit()
            return jsonify({"message": "Profile updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    # Validate required fields for new profiles
    if not all([name, phone, service_type, pincode]):
        return jsonify({"error": "Missing required fields: name, phone, service_type, or pincode"}), 400
    
    x = Service.query.filter_by(name = service_type).first()
    service_price = x.price
    # Create new profile
    new_profile = ProfessionalProfile(
        user_id=current_user,
        name=name,
        phone=phone,
        service_type=service_type,
        experience=experience,
        pincode=pincode,
        service_price=service_price
    )
    try:
        db.session.add(new_profile)
        db.session.commit()
        return jsonify({"message": "Profile created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/ratings')
@jwt_required()
@role_required('professional')
def ratings():
    id = get_jwt_identity()['id']
    ratings=ProfessionalProfile.query.filter_by(id=id).first()
    return jsonify({
        'rating': ratings.rating
    }), 200

    

@app.route('/professional_dashboard/viewprofile', methods=['GET'])
@jwt_required()  # Ensures the user is authenticated via JWT
@role_required('professional')  # Ensures the user has the "professional" role
def view_profile():
    # Get the current user's ID from the JWT (assuming payload contains `id` and `role`)
    jwt_payload = get_jwt_identity()  # This returns a dictionary
    
    # Extract the ID from the payload
    current_user_id = jwt_payload.get('id')  # Safely get 'id' from the payload

    if not current_user_id:
        app.logger.error("No valid user ID found in JWT")
        return jsonify({"error": "Invalid JWT payload"}), 401

    # Query the database for the professional's details using user_id
    professional = ProfessionalProfile.query.filter_by(user_id=current_user_id).first()

    if not professional:
        app.logger.error(f"No professional profile found for user_id {current_user_id}")
        return jsonify({"error": "Professional not found"}), 404

    # Get the hourly rate from the Service table based on the service_type
    service = Service.query.filter_by(name=professional.service_type).first()
    hourly_rate = service.price if service else None  # If no service is found, return None

    # Return the professional's data as a JSON response
    return jsonify({
        "id": professional.id,
        "user_id": professional.user_id,
        "name": professional.name,
        "phone": professional.phone,
        "service_type": professional.service_type,
        "experience": professional.experience,
        "rating": professional.rating,
        "hourly_rate": hourly_rate,  # Include the hourly rate in the response
        "pincode": professional.pincode,
        "date_created": professional.date_created.isoformat(),  # Convert datetime to string
    }), 200



def update_service_status(service_request_id, new_status, hours_worked=None):
    # Fetch the service request by ID
    service_request = ServiceRequest.query.get(service_request_id)
    if not service_request:
        return jsonify({"error": "Service request not found"}), 404

    if new_status == 'completed':
        if not hours_worked:
            return jsonify({"error": "Hours worked must be provided to complete the service"}), 400

        if not service_request.hourly_rate:
            return jsonify({"error": "Hourly rate is missing for this service request"}), 400

        # Calculate total price and update fields
        service_request.hours_worked = hours_worked
        service_request.total_price = service_request.hourly_rate * hours_worked
        service_request.date_of_completion = datetime.utcnow()

    # Update the service status
    service_request.service_status = new_status

    try:
        db.session.commit()
        return jsonify({"message": "Service status updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
@app.route('/professional_dashboard/service_requests', methods=['GET'])
@jwt_required()
@role_required('professional')
def get_service_requests():
    current_user_id = get_jwt_identity()['id']
    professional = ProfessionalProfile.query.filter_by(user_id=current_user_id).first()
    professional_id =professional.id
    service_requests = ServiceRequest.query.filter_by(professional_id=professional_id).all()
    if not service_requests:
        return jsonify({"message": "You have no requested Services. Please Wait!"}), 202  # Return an empty list if no requests are found
    
    return jsonify([{
        "id": req.id,
        "serviceName": req.service_name,
        "customerName": req.customer_name,
        "remarks": req.remarks,
        "service_status": req.service_status,
    } for req in service_requests]), 200
    

# Accept Service Request
@app.route('/professional_dashboard/service_requests/accept/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('professional')
def accept_service_request(request_id):
    professional = get_jwt_identity()['id']  # Get the professional ID from the JWT token
    
    prof = ProfessionalProfile.query.filter_by(user_id=professional).first()
    professional_id = prof.id
    service_request = ServiceRequest.query.filter_by(id=request_id, professional_id=professional_id).first()

    if not service_request:
        return jsonify({"error": "Service request not found or unauthorized"}), 404

    if service_request.service_status != 'requested':
        return jsonify({"error": "Request cannot be accepted in its current state"}), 400

    service_request.service_status = 'in progress'
    db.session.commit()

    return jsonify({"message": "Service request accepted", "request_id": request_id, "status": "in progress"}), 200

# Reject Service Request
@app.route('/professional_dashboard/service_requests/reject/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('professional')
def reject_service_request(request_id):
    professional = get_jwt_identity()['id'] # Get the professional ID from the JWT token

    prof = ProfessionalProfile.query.filter_by(user_id=professional).first()
    professional_id = prof.id
    service_request = ServiceRequest.query.filter_by(id=request_id, professional_id=professional_id).first()

    if not service_request:
        return jsonify({"error": "Service request not found or unauthorized"}), 404

    if service_request.service_status != 'requested':
        return jsonify({"error": "Request cannot be rejected in its current state"}), 400

    service_request.service_status = 'rejected'
    db.session.commit()

    return jsonify({"message": "Service request rejected", "request_id": request_id, "status": "rejected"}), 200

# Mark Service Request as Completed
@app.route('/professional_dashboard/service_requests/complete/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('professional')
def complete_service_request(request_id):
    professional = get_jwt_identity()['id']  # Get the professional ID from the JWT token

    prof = ProfessionalProfile.query.filter_by(user_id=professional).first()
    professional_id = prof.id
    service_request = ServiceRequest.query.filter_by(id=request_id, professional_id=professional_id).first()

    if not service_request:
        return jsonify({"error": "Service request not found or unauthorized"}), 404

    if service_request.service_status != 'in progress':
        return jsonify({"error": "Request cannot be completed in its current state"}), 400

    service_request.date_of_completion = datetime.utcnow()

    # Fetch professional's hourly rate
    professional = ProfessionalProfile.query.filter_by(id=service_request.professional_id).first()
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

   # Calculate hours worked
    time_difference = service_request.date_of_completion - service_request.date_of_request
    hours_worked = time_difference.total_seconds() / 3600  # Convert seconds to hours
    service_request.hours_worked = round(hours_worked, 2)  # Round to 2 decimal places
    db.session.commit()

    # Fetch professional's hourly rate
    professional = ProfessionalProfile.query.filter_by(id=service_request.professional_id).first()
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    # Calculate total price
    service_request.total_price = service_request.hours_worked * professional.service_price

    # Update service status
    service_request.service_status = 'completed'

    db.session.commit()

    return jsonify({
        "message": "Service request marked as completed",
        "request_id": request_id,
        "status": "completed",
        "date_of_completion": service_request.date_of_completion,
        "hours_worked": service_request.hours_worked,
        "total_price": service_request.total_price,
    }), 200

@app.route('/professional_dashboard/history', methods=['GET'])
@jwt_required()
@role_required('professional')
def history():
    # Get the professional's ID from the JWT token
    professional_id = get_jwt_identity()['id']

    # Query the database for the service requests associated with the professional's ID
    services = ServiceRequest.query.filter_by(professional_id=professional_id).all()

    # Check if the professional has any service history
    if not services:
        return jsonify({"message": "No service history found for this professional."}), 404

    # Create a list of service history details to return
    service_history = [{
        "customer_name": service.customer_name,
        "professional_name": service.professional_name,
        "service_name": service.service_name,
        "rating": service.rating,
        "hourly_rate": service.hourly_rate,
        "hours_worked": service.hours_worked,
        "total_price": service.total_price,
        "date_of_request": service.date_of_request.strftime('%Y-%m-%d'),
        "date_of_completion": service.date_of_completion.strftime('%Y-%m-%d') if service.date_of_completion else None
    } for service in services]

    # Return the service history as a JSON response
    return jsonify(service_history), 200


#____________________________________________________customer_panel___________________________________________________________


@app.route('/customer_dashboard/search_services', methods=['GET'])
@jwt_required()
@role_required('customer')
def search_services():
    # Extract the service_name and pincode from the query parameters
    service_name = request.args.get('service_name')
    pincode = request.args.get('pincode')
    
    # Build the query with optional filtering by both service_name and pincode
    query = ProfessionalProfile.query
    
    if service_name:
        query = query.filter(ProfessionalProfile.service_type.ilike(f"%{service_name}%"))
    
    if pincode:
        query = query.filter(ProfessionalProfile.pincode == pincode)
    
    professionals = query.order_by(ProfessionalProfile.rating.desc()).all()

    # Check if professionals are found
    if not professionals:
        return jsonify({"message": "No service professionals found for the given search criteria"}), 404

    # Prepare the response data
    response_data = [
        {
            "id": professional.id,
            "name": professional.name,
            "phone": professional.phone,
            "service_type": professional.service_type,
            "rating": professional.rating,
            "experience": professional.experience,
            "pincode": professional.pincode,
            "hourly_rate": professional.service_price
        }
        for professional in professionals
    ]

    return jsonify(response_data), 200


from flask_mail import Mail, Message

# Initialize Flask-Mail
mail = Mail(app)

@app.route('/customer_dashboard/request_service', methods=['POST'])
@jwt_required()
@role_required('customer')
def request_service():
    # Get the request data
    data = request.get_json()
    jwt_payload = get_jwt_identity()  # Extracting identity from JWT
    current_user_id = jwt_payload.get('id')  # Customer ID from JWT

    # Fetch customer profile to get the customer name
    customer_profile = CustomerProfile.query.filter_by(user_id=current_user_id).first()
    
    if not customer_profile:
        return jsonify({"error": "Customer profile not found"}), 404
    customer_id = customer_profile.id
    customer_name = customer_profile.name

    # Validate the input
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    required_fields = ['service_name', 'professional_id', 'pincode', 'remarks']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    # Extract the data
    professional_id = data['professional_id']
    service_name = data['service_name']
    pincode = data['pincode']
    remarks = data['remarks']

    # Fetch the professional's details
    professional = ProfessionalProfile.query.filter_by(id=professional_id).first()
    user = User.query.filter_by(id=professional.user_id).first()
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    professional_name = professional.name
    professional_email = user.email
    professional_hourly_rate = professional.service_price

    # Validate pincode
    if len(str(pincode)) != 6 or not str(pincode).isdigit():
        return jsonify({"error": "Invalid pincode"}), 400

    # Create a new service request
    service_request = ServiceRequest(
        customer_name=customer_name,
        service_name=service_name,
        professional_name=professional_name,
        pincode=pincode,
        remarks=remarks,
        professional_id=professional_id,
        hourly_rate=professional_hourly_rate,
        customer_id=customer_id
    )
    
    db.session.add(service_request)
    db.session.commit()

    # Send an email notification to the professional
    subject = f"New Service Request: {service_name}"
    email_body = f"""
    Dear {professional_name},

    A new service request has been submitted for your service:

    - Service Name: {service_name}
    - Requested by: {customer_name}
    - Pincode: {pincode}
    - Remarks: {remarks}

    Please log in to your dashboard to accept or decline the request.

    Best regards,
    Cuts Service Connect
    """

    try:
        msg = Message(subject=subject, sender="abcd@gmail.com", recipients=[professional_email])
        msg.body = email_body
        mail.send(msg)
    except Exception as e:
        return jsonify({"error": f"Service request submitted but email failed: {str(e)}"}), 200

    return jsonify({"message": "Service request submitted successfully, and email notification sent"}), 200



@app.route('/customer_dashboard/service_history', methods=['GET'])
@jwt_required()
@role_required('customer') 
def get_service_history():
    # Get the current logged-in user’s ID from the JWT
    jwt_payload = get_jwt_identity()
    customer_id = jwt_payload.get('id')

    cust = CustomerProfile.query.filter_by(user_id=customer_id).first()
    cust_id = cust.id

    # Fetch the service requests for the logged-in customer
    service_history = ServiceRequest.query.filter_by(customer_id=cust_id).all()

    # Return the service history data
    if service_history:
        history_data = [
            {   'id': entry.id,
                'customer_name': entry.customer_name,
                'professional_name': entry.professional_name,
                "service_name": entry.service_name,
                'price_per_hour': entry.hourly_rate,  # Assuming this is part of ServiceRequest
                'date_of_request': entry.date_of_request.strftime('%Y-%m-%d %H:%M:%S'),
                'date_of_completion': entry.date_of_completion.strftime('%Y-%m-%d %H:%M:%S') if entry.date_of_completion else None,
                'total_hour': entry.hours_worked,  # Assuming this is part of ServiceRequest
                'total_price': entry.total_price,  # Assuming this is part of ServiceRequest
                'ratings': entry.rating if entry.rating else None,  # Rating after completion
                'status': entry.service_status,
            }
            for entry in service_history
        ]
        return jsonify(history_data), 200
    else:
        return jsonify({"message": "No service history found."}), 404



# Endpoint to create or update customer profile
@app.route('/customer_dashboard/update_profile', methods=['PUT'])
@jwt_required()
@role_required('customer')  # Ensure only customers can access this function
def create_or_update_profile():
    user_id = get_jwt_identity()['id']  # Get the user ID from the JWT token
    
    # Retrieve the customer profile, if it exists
    profile = CustomerProfile.query.filter_by(user_id=user_id).first()
    
    # Get data from the request body
    name = request.json.get('name')
    phone = request.json.get('phone')
    address = request.json.get('address')
    
    # Validate input data
    if not name or not phone or not address:
        return jsonify({"error": "Name, phone, and address are required."}), 400
    
    if profile:
        # Update the existing profile
        profile.name = name
        profile.phone = phone
        profile.address = address
        db.session.commit()
        return jsonify({"message": "Profile updated successfully."}), 200
    else:
        # Create a new profile
        new_profile = CustomerProfile(user_id=user_id, name=name, phone=phone, address=address)
        db.session.add(new_profile)
        db.session.commit()
        return jsonify({"message": "Profile created successfully."}), 201


@app.route('/customer_dashboard/get_profile', methods=['GET'])
@jwt_required()
@role_required('customer')
def get_profile():
    # Get the current user's ID from the JWT token
    user_id = get_jwt_identity()['id']

    # Query the CustomerProfile table for the current user's profile
    customer_profile = CustomerProfile.query.filter_by(user_id=user_id).first()

    if not customer_profile:
        return jsonify({"error": "Profile not found"}), 404

    # Return the profile data as a JSON response
    return jsonify({
        "name": customer_profile.name,
        "phone": customer_profile.phone,
        "address": customer_profile.address
    })

def update_professional_rating(professional_id):
    # Fetch all completed service requests with a rating for the professional
    service_requests = ServiceRequest.query.filter_by(
        professional_id=professional_id, 
        service_status='completed'
    ).filter(ServiceRequest.rating.isnot(None)).all()

    # If there are no completed requests with ratings, set the rating to None
    if not service_requests:
        professional = ProfessionalProfile.query.get(professional_id)
        if professional:
            professional.rating = None
            db.session.commit()
        return

    # Calculate the average rating
    total_ratings = sum(request.rating for request in service_requests)
    average_rating = total_ratings / len(service_requests)

    # Update the ProfessionalProfile with the calculated average rating
    professional = ProfessionalProfile.query.get(professional_id)
    if professional:
        professional.rating = round(average_rating, 2)  # Round to 2 decimal places
        db.session.commit()


@app.route('/customer_dashboard/service_requests/rate/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('customer')
def rate_service_request(request_id):
    data = request.get_json()
    rate = data.get('rating')

    if not rate or not (1 <= rate <= 5):
        return jsonify({"error": "Invalid rating. Must be between 1 and 5"}), 400

    # Fetch the service request
    service_request = ServiceRequest.query.get(request_id)

    if not service_request or service_request.service_status != 'completed':
        return jsonify({"error": "Service request not found or not completed"}), 404

    # Update the rating for the service request
    service_request.rating = rate
    db.session.commit()

    # Update the professional's average rating
    update_professional_rating(service_request.professional_id)

    return jsonify({"message": "Rating submitted successfully"}), 200

@app.route('/services', methods=['GET'])
@jwt_required()
@role_required('professional')
def services():
    service = Service.query.all()
    return jsonify([req.name for req in service]), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run()
