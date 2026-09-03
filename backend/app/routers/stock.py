import uuid
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db
from app.models.user import User
from app.models.product import Product
from app.models.stock import StockMovement
from app.schemas.order import StockAdjust,StockOut
from app.utils.dependencies import require_admin
router=APIRouter(prefix='/admin/stock',tags=['Stock'])
@router.patch('/{product_id}',response_model=StockOut)
def adjust_stock(product_id:uuid.UUID,p:StockAdjust,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    prod=db.query(Product).filter(Product.id==product_id).with_for_update().first()
    if not prod: raise HTTPException(404,'Product not found')
    new=prod.stock+p.quantity_change
    if new<0: raise HTTPException(400,'Stock cannot be negative')
    prod.stock=new
    db.add(StockMovement(product_id=product_id,quantity_change=p.quantity_change,reason=p.reason))
    db.commit(); return {'product_id':product_id,'stock':prod.stock}
@router.get('',response_model=list[dict])
def stock_list(db:Session=Depends(get_db),_:User=Depends(require_admin)):
    return [{'id':str(p.id),'name':p.name,'sku':p.sku,'stock':p.stock,'status':p.status.value} for p in db.query(Product).order_by(Product.name).all()]
