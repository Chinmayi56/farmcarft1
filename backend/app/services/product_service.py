"""
Product business logic (Backend Step 5A): CRUD operations against the
`products` table. Kept separate from the router so it is independently
testable, matching the pattern used by `auth_service.py`.
"""
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductError(Exception):
    """Raised for a Product operation failure. The message is safe to
    surface directly to API callers."""


class ProductNotFoundError(ProductError):
    """Raised when a Product lookup by id fails."""


def get_product(db: Session, product_id) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise ProductNotFoundError("Product not found")
    return product


def list_products(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    category: str | None = None,
    status: str | None = None,
    search: str | None = None,
) -> tuple[list[Product], int]:
    """Return (items, total) applying optional filters/pagination."""
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)
    if status:
        query = query.filter(Product.status == status)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(or_(Product.name.ilike(like), Product.sku.ilike(like)))

    total = query.count()
    items = (
        query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    )
    return items, total


def _sku_taken(db: Session, sku: str, *, exclude_id=None) -> bool:
    query = db.query(Product.id).filter(Product.sku == sku)
    if exclude_id is not None:
        query = query.filter(Product.id != exclude_id)
    return db.query(query.exists()).scalar()


def create_product(db: Session, payload: ProductCreate) -> Product:
    if _sku_taken(db, payload.sku):
        raise ProductError(f"A product with SKU '{payload.sku}' already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id, payload: ProductUpdate) -> Product:
    product = get_product(db, product_id)

    updates = payload.model_dump(exclude_unset=True)
    if "sku" in updates and updates["sku"] != product.sku:
        if _sku_taken(db, updates["sku"], exclude_id=product.id):
            raise ProductError(f"A product with SKU '{updates['sku']}' already exists")

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
