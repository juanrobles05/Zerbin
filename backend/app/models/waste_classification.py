from sqlalchemy import Column, Integer, String, Text
from app.models.base import Base

class WasteClassification(Base):
    """
    Modelo para almacenar información sobre tipos de residuos,
    incluyendo el tiempo de descomposición y prioridad asignada.
    """
    __tablename__ = "waste_classifications"

    id = Column(Integer, primary_key=True, index=True)
    waste_type = Column(String, unique=True, nullable=False, index=True)
    decomposition_time_days = Column(Integer, nullable=False)  # Tiempo en días
    priority_level = Column(Integer, nullable=False)  # 1=low, 2=medium, 3=high
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<WasteClassification(type={self.waste_type}, decomposition_days={self.decomposition_time_days}, priority={self.priority_level})>"