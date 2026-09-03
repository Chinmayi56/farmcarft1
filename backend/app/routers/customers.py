import uuid
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.user import User,UserRole
from app.models.order import Order,OrderStatus
from app.utils.dependencies import require_admin
router=APIRouter(prefix='/admin/customers',tags=['Admin Customers'])

def _serialize_customer(u:User,db:Session)->dict:
    orders=db.query(Order).filter(Order.customer_id==u.id).all(); valid=[o for o in orders if o.status!=OrderStatus.CANCELLED]
    return {'id':str(u.id),'name':u.name or u.email.split('@')[0],'email':u.email,'phone':'','location':'','totalOrders':len(valid),'totalSpent':float(sum((o.total_amount for o in valid),0)),'joinedAt':u.created_at.isoformat(),'status':'Active' if u.is_active else 'Inactive'}

@router.get('')
def customers(db:Session=Depends(get_db),_:User=Depends(require_admin)):
    users=db.query(User).filter(User.role==UserRole.CUSTOMER).order_by(User.created_at.desc()).all()
    return [_serialize_customer(u,db) for u in users]

@router.get('/{customer_id}')
def customer_detail(customer_id:str,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    try:
        cid=uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(404,'Customer not found')
    u=db.query(User).filter(User.id==cid,User.role==UserRole.CUSTOMER).first()
    if not u:
        raise HTTPException(404,'Customer not found')
    return _serialize_customer(u,db)
