# app/models/base.py

from sqlalchemy.orm import declarative_base

# `declarative_base()` es la función que retorna la clase base
# de la que tus modelos de datos deben heredar.
Base = declarative_base()