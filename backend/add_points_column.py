"""
Script para agregar la columna 'points' a la tabla users
"""
from app.core.database import engine
from sqlalchemy import text

def add_points_column():
    """Agrega la columna points a la tabla users si no existe"""
    try:
        with engine.connect() as conn:
            # Verificar si la columna ya existe
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='points'
            """)
            result = conn.execute(check_query)
            
            if result.fetchone() is None:
                print("⚠️  La columna 'points' no existe. Agregándola...")
                
                # Agregar la columna points con valor por defecto 0
                alter_query = text("""
                    ALTER TABLE users 
                    ADD COLUMN points INTEGER DEFAULT 0 NOT NULL
                """)
                conn.execute(alter_query)
                conn.commit()
                
                print("✅ Columna 'points' agregada exitosamente con valor por defecto 0")
            else:
                print("✅ La columna 'points' ya existe en la tabla users")
                
    except Exception as e:
        print(f"❌ Error al agregar la columna: {e}")
        raise

if __name__ == "__main__":
    print("🔧 Iniciando migración de base de datos...")
    add_points_column()
    print("🎉 Migración completada!")
