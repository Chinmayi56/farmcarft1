import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.order import CartItemAdd,CartItemUpdate,CartOut,OrderCreate,OrderOut,OrderStatusUpdate
from app.services import order_service
from app.utils.dependencies import require_customer, require_admin
router=APIRouter(tags=['Cart & Orders'])
@router.get('/cart',response_model=CartOut)
def get_cart(db:Session=Depends(get_db),user:User=Depends(require_customer)): return order_service.cart_out(order_service.get_or_create_cart(db,user.id))
@router.post('/cart/items',response_model=CartOut,status_code=201)
def add_cart(p:CartItemAdd,db:Session=Depends(get_db),user:User=Depends(require_customer)):
    try:return order_service.cart_out(order_service.add_item(db,user.id,p.product_id,p.quantity))
    except ValueError as e: raise HTTPException(400,str(e))
@router.put('/cart/items/{item_id}',response_model=CartOut)
def update_cart(item_id:uuid.UUID,p:CartItemUpdate,db:Session=Depends(get_db),user:User=Depends(require_customer)):
    try:return order_service.cart_out(order_service.update_item(db,user.id,item_id,p.quantity))
    except ValueError as e: raise HTTPException(400,str(e))
@router.delete('/cart/items/{item_id}',response_model=CartOut)
def remove_cart(item_id:uuid.UUID,db:Session=Depends(get_db),user:User=Depends(require_customer)):
    try:return order_service.cart_out(order_service.remove_item(db,user.id,item_id))
    except ValueError as e: raise HTTPException(404,str(e))
@router.delete('/cart',response_model=CartOut)
def clear_cart(db:Session=Depends(get_db),user:User=Depends(require_customer)): return order_service.cart_out(order_service.clear_cart(db,user.id))
@router.post('/orders',response_model=OrderOut,status_code=201)
def create_order(p:OrderCreate,db:Session=Depends(get_db),user:User=Depends(require_customer)):
    try:return order_service.create_order(db,user,p)
    except ValueError as e: raise HTTPException(400,str(e))
@router.get('/orders',response_model=list[OrderOut])
def my_orders(db:Session=Depends(get_db),user:User=Depends(require_customer)): return order_service.list_orders(db,user)
@router.get('/orders/{order_id}',response_model=OrderOut)
def my_order(order_id:uuid.UUID,db:Session=Depends(get_db),user:User=Depends(require_customer)):
    o=order_service.get_order(db,order_id,user)
    if not o: raise HTTPException(404,'Order not found')
    return o
@router.get('/admin/orders',response_model=list[OrderOut])
def admin_orders(db:Session=Depends(get_db),_:User=Depends(require_admin)): return order_service.list_orders(db)
@router.patch('/admin/orders/{order_ref}',response_model=OrderOut)
def admin_update_order(order_ref:str,p:OrderStatusUpdate,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    try: oid=uuid.UUID(order_ref); o=order_service.get_order(db,oid)
    except ValueError: o=db.query(__import__('app.models.order',fromlist=['Order']).Order).filter(__import__('app.models.order',fromlist=['Order']).Order.order_number==order_ref).first()
    if not o: raise HTTPException(404,'Order not found')
    o.status=p.status; db.commit(); db.refresh(o); return order_service.get_order(db,o.id)
