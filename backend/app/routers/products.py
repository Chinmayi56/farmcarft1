"""
Product CRUD routes (Backend Step 5A):

- GET    /api/products         PUBLIC
- GET    /api/products/{id}    PUBLIC
- POST   /api/products         ADMIN only
- PUT    /api/products/{id}    ADMIN only
- DELETE /api/products/{id}    ADMIN only

Read endpoints (GET) require no authentication, since the customer
storefront needs to support public product browsing. Write endpoints
(POST/PUT/DELETE) are restricted to ADMIN via the existing
`require_admin` dependency (Backend Step 4).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.product import ProductStatus
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
)
from app.services import product_service
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> ProductOut:
    """Create a new product. ADMIN only."""
    try:
        product = product_service.create_product(db, payload)
    except product_service.ProductError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return ProductOut.model_validate(product)


@router.get("", response_model=ProductListResponse)
def list_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    category: str | None = Query(default=None),
    status_filter: ProductStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, description="Matches product name or SKU"),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """List products with optional filtering/search and pagination."""
    items, total = product_service.list_products(
        db,
        skip=skip,
        limit=limit,
        category=category,
        status=status_filter,
        search=search,
    )
    return ProductListResponse(
        total=total, items=[ProductOut.model_validate(p) for p in items]
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ProductOut:
    """Fetch a single product by id."""
    try:
        product = product_service.get_product(db, product_id)
    except product_service.ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return ProductOut.model_validate(product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> ProductOut:
    """Update an existing product (partial update). ADMIN only."""
    try:
        product = product_service.update_product(db, product_id, payload)
    except product_service.ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except product_service.ProductError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return ProductOut.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    """Delete a product. ADMIN only."""
    try:
        product_service.delete_product(db, product_id)
    except product_service.ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
