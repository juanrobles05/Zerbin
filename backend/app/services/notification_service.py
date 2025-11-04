from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.report import Report
import logging
import json

logger = logging.getLogger(__name__)

class NotificationService:
    """Servicio para gestión de notificaciones"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = NotificationType.GENERAL.value,
        report_id: Optional[int] = None,
        metadata: Optional[dict] = None
    ) -> Notification:
        """
        Crear una nueva notificación
        """
        try:
            notification = Notification(
                user_id=user_id,
                report_id=report_id,
                type=notification_type,
                title=title,
                message=message,
                metadata=json.dumps(metadata) if metadata else None,
                is_read=False,
                is_sent=False
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            logger.info(f"✅ Notificación creada para usuario {user_id}: {title}")
            return notification
            
        except Exception as e:
            logger.error(f"❌ Error creando notificación: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def notify_status_change(
        db: Session,
        report_id: int,
        old_status: str,
        new_status: str
    ) -> Optional[Notification]:
        """
        Crear notificación cuando cambia el estado de un reporte
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report or not report.user_id:
            return None
        
        # Mensajes personalizados por estado
        status_messages = {
            "assigned": {
                "title": "📋 Reporte Asignado",
                "message": f"Tu reporte #{report_id} ha sido asignado a un equipo de recolección."
            },
            "in_progress": {
                "title": "🚛 Recolección en Progreso",
                "message": f"El equipo está en camino para recolectar el residuo reportado en #{report_id}."
            },
            "collected": {
                "title": "✅ Reporte Completado",
                "message": f"¡Excelente! El residuo del reporte #{report_id} ha sido recolectado exitosamente. ¡Gracias por ayudar a mantener limpia nuestra ciudad!"
            },
            "rejected": {
                "title": "❌ Reporte Rechazado",
                "message": f"Tu reporte #{report_id} no pudo ser procesado."
            },
            "cancelled": {
                "title": "🚫 Reporte Cancelado",
                "message": f"El reporte #{report_id} ha sido cancelado."
            }
        }
        
        status_info = status_messages.get(new_status, {
            "title": "📢 Actualización de Estado",
            "message": f"El estado de tu reporte #{report_id} ha cambiado a: {new_status}"
        })
        
        metadata = {
            "report_id": report_id,
            "old_status": old_status,
            "new_status": new_status,
            "waste_type": report.waste_type,
            "location": f"{report.latitude},{report.longitude}"
        }
        
        return NotificationService.create_notification(
            db=db,
            user_id=report.user_id,
            title=status_info["title"],
            message=status_info["message"],
            notification_type=NotificationType.STATUS_CHANGE.value,
            report_id=report_id,
            metadata=metadata
        )
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False
    ) -> tuple[List[Notification], int, int]:
        """
        Obtener notificaciones de un usuario
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        query = query.order_by(Notification.created_at.desc())
        
        total = query.count()
        unread_count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        notifications = query.offset(skip).limit(limit).all()
        
        return notifications, total, unread_count
    
    @staticmethod
    def mark_as_read(
        db: Session,
        notification_ids: List[int],
        user_id: int
    ) -> int:
        """
        Marcar notificaciones como leídas
        """
        try:
            updated = db.query(Notification).filter(
                Notification.id.in_(notification_ids),
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update(
                {
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc)
                },
                synchronize_session=False
            )
            
            db.commit()
            logger.info(f"✅ {updated} notificaciones marcadas como leídas")
            return updated
            
        except Exception as e:
            logger.error(f"❌ Error marcando notificaciones: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """
        Marcar todas las notificaciones de un usuario como leídas
        """
        try:
            updated = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update(
                {
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc)
                },
                synchronize_session=False
            )
            
            db.commit()
            return updated
            
        except Exception as e:
            db.rollback()
            raise
    
    @staticmethod
    def delete_notification(
        db: Session,
        notification_id: int,
        user_id: int
    ) -> bool:
        """
        Eliminar una notificación
        """
        try:
            notification = db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()
            
            if notification:
                db.delete(notification)
                db.commit()
                return True
            return False
            
        except Exception as e:
            db.rollback()
            raise