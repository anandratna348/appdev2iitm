from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'  
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, nullable=False, unique=True)
    password = db.Column(db.String, nullable=False)
    active = db.Column(db.Boolean, default=True)
    fs_uniquifier = db.Column(db.String(), nullable=False)
    roles = db.relationship('Role', secondary='user_roles', backref='users')
    
    professional_profiles = db.relationship('ProfessionalProfile', backref='owner', lazy='dynamic')

class UserRoles(db.Model):
    __tablename__ = 'user_roles'  
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))

class Role(db.Model, RoleMixin):
    __tablename__ = 'roles' 
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String)
    
class ProfessionalProfile(db.Model):
    __tablename__ = 'professional_profiles'  # Explicitly setting the table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_price = db.Column(db.Float, db.ForeignKey('services.price'), nullable = False)
    name = db.Column(db.String, nullable = False)
    phone = db.Column(db.Integer, nullable = False)
    service_type = db.Column(db.String, nullable=False)
    experience = db.Column(db.Integer, nullable=True)
    rating = db.Column(db.Float, nullable=True)
    pincode = db.Column(db.Integer, nullable = False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    active = db.Column(db.Boolean, default=True)
    
class CustomerProfile(db.Model):
    __tablename__ = 'customer_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String, nullable = False)
    phone = db.Column(db.Integer, nullable = False)
    address = db.Column(db.Integer, nullable = False)
    active = db.Column(db.Boolean, default=True)
    
class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    time_required = db.Column(db.Text, nullable = False)
    price = db.Column(db.Float, nullable=False)
    
    
class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'
    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(db.Integer, db.ForeignKey('professional_profiles.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer_profiles.id'), nullable=False)
    customer_name = db.Column(db.String, nullable=False)
    professional_name = db.Column(db.String, nullable=False)
    service_name = db.Column(db.String, db.ForeignKey('professional_profiles.service_type'), nullable=False)
    date_of_request = db.Column(db.DateTime, default=datetime.utcnow)
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String(50), nullable=False, default='requested') 
    remarks = db.Column(db.Text, nullable=True)
    pincode = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    hourly_rate = db.Column(db.Float, nullable=False) 
    total_price = db.Column(db.Float, nullable=True)  
    hours_worked = db.Column(db.Float, nullable=True)

    