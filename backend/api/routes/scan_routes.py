import json
import threading
import queue
import time
from flask import Blueprint, request, jsonify, current_app
from backend.database.models.scan_model import Scan
from backend.database.connection import DatabaseConnection
from backend.tasks import run_scan_task
from backend.api.utils import ErrorHandler

# File d'attente en mémoire pour les tâches de scan
scan_queue = queue.Queue()
scan_worker_running = False

def scan_worker():
    """
    Worker qui traite les tâches de scan en arrière-plan
    """
    global scan_worker_running
    scan_worker_running = True
    
    while scan_worker_running:
        try:
            # Récupérer une tâche de la queue (timeout de 1 seconde)
            scan_id = scan_queue.get(timeout=1)
            
            try:
                # Exécuter la tâche de scan
                run_scan_task(scan_id)
                print(f"Scan {scan_id} terminé avec succès")
            except Exception as e:
                print(f"Erreur lors du scan {scan_id}: {e}")
                # Mettre à jour le statut en cas d'échec
                db = DatabaseConnection.get_instance().get_session()
                try:
                    scan = db.query(Scan).filter_by(id=scan_id).first()
                    if scan:
                        scan.status = 'failed'
                        db.commit()
                except:
                    db.rollback()
                finally:
                    db.close()
            
            # Marquer la tâche comme terminée
            scan_queue.task_done()
            
        except queue.Empty:
            # Pas de tâche dans la queue, continuer la boucle
            continue
        except Exception as e:
            print(f"Erreur dans le worker: {e}")
            time.sleep(1)

# Démarrer le worker en arrière-plan
worker_thread = threading.Thread(target=scan_worker, daemon=True)
worker_thread.start()

scans_bp = Blueprint('scans', __name__)

@scans_bp.route('/', methods=['GET'])
def get_all_scans():
    """
    get_all_scans Récupère tous les scans
    :return: Liste de scans
    """
    db = DatabaseConnection.get_instance().get_session()
    try:
        scans = db.query(Scan).all()  # Récupère tous les scans
        return jsonify([scan.to_dict() for scan in scans]), 200
    except Exception as e:
        db.rollback() 
        return ErrorHandler.handle_error(e, 'Failed to retrieve scans', 500)
    finally:
        DatabaseConnection.get_instance().close_session(db)


@scans_bp.route('/<int:scan_id>', methods=['GET']) 
def get_scan(scan_id):
    """
    get_scan Récupère un scan par ID
    :param scan_id: ID du scan
    :return: Détails du scan
    """
    db = DatabaseConnection.get_instance().get_session() 
    try:
        scan = db.query(Scan).filter_by(id=scan_id).first() 
        if scan is None:
            return ErrorHandler.handle_error(None, 'Scan not found', 404)
        return jsonify(scan.to_dict()), 200
    except Exception as e:
        db.rollback()
        return ErrorHandler.handle_error(e, 'Failed to retrieve scan', 500)
    finally:
        DatabaseConnection.get_instance().close_session(db)

@scans_bp.route('/', methods=['POST'])
def start_scan():
    """
    start_scan Démarre un scan
    :return: ID du scan et statut
    """
    data = request.get_json()
    target = data.get('target')

    # Valider les données
    if not target:
        return ErrorHandler.handle_error(None, 'Missing parameter "target"', 400)

    # Créer une entrée de scan en base de données
    db = DatabaseConnection.get_instance().get_session()
    try:
        new_scan = Scan(target_url=target, status='pending')
        db.add(new_scan)
        db.commit()
        scan_id = new_scan.id
        scan_status = new_scan.status
    except Exception as e:
        db.rollback()
        return ErrorHandler.handle_error(e, 'Failed to start scan', 500)
    finally:
        db.close()

    # Ajouter la tâche à la file d'attente en mémoire
    try:
        scan_queue.put(scan_id)
        print(f"Scan {scan_id} ajouté à la file d'attente")
    except Exception as e:
        print(f"Erreur lors de l'ajout du scan {scan_id} à la queue: {e}")
        # Mettre à jour le statut en cas d'échec
        db = DatabaseConnection.get_instance().get_session()
        try:
            scan = db.query(Scan).filter_by(id=scan_id).first()
            if scan:
                scan.status = 'failed'
                db.commit()
        except:
            db.rollback()
        finally:
            db.close()

    return jsonify({
        'scan_id': scan_id,
        'status': scan_status,
    }), 200

@scans_bp.route('/', methods=['DELETE'])
def delete_all_scans():
    """
    delete_all_scans Supprime tous les scans
    :return: Réponse vide
    """
    db = DatabaseConnection.get_instance().get_session()
    try:
        # Supprimer tous les scans
        db.query(Scan).delete()
        db.commit()
        return '', 204
    except Exception as e:
        db.rollback() 
        return ErrorHandler.handle_error(e, 'Failed to delete all scans', 500)
    finally:
        DatabaseConnection.get_instance().close_session(db)

@scans_bp.route('/<int:scan_id>', methods=['DELETE'])
def delete_scan(scan_id):
    """
    delete_scan Supprime un scan par ID
    :param scan_id: ID du scan
    :return: Réponse vide
    """
    db = DatabaseConnection.get_instance().get_session()
    try:
        scan = db.query(Scan).filter_by(id=scan_id).first()
        if scan is None:
            return ErrorHandler.handle_error(None, 'Scan not found', 404)

        db.delete(scan)
        db.commit()
        return '', 204
    except Exception as e:
        db.rollback() 
        return ErrorHandler.handle_error(e, 'Failed to delete scan', 500)
    finally:
        DatabaseConnection.get_instance().close_session(db)

@scans_bp.route('/<int:scan_id>/status', methods=['GET'])
def get_scan_status(scan_id):
    """
    get_scan_status Récupère le statut d'un scan par ID
    :param scan_id: ID du scan
    :return: Statut du scan
    """
    db = DatabaseConnection.get_instance().get_session()
    try:
        scan = db.query(Scan).filter_by(id=scan_id).first()
        if scan:
            return jsonify({
                'scan_id': scan.id,
                'status': scan.status
            }), 200
        else:
            return ErrorHandler.handle_error(None, 'Scan not found', 404)
    except Exception as e:
        db.rollback()
        return ErrorHandler.handle_error(e, 'Failed to retrieve scan status', 500)
    finally:
        db.close()