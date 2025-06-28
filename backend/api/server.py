from flask import Blueprint, Flask
from backend.api.routes.scan_routes import scans_bp
from .routes.report_routes import reports_bp
from flask_cors import CORS

api = Blueprint('api', __name__)
app = Flask(__name__)
CORS(app)

# Register route blueprints
api.register_blueprint(scans_bp, url_prefix='/scans')
api.register_blueprint(reports_bp, url_prefix='/reports')

