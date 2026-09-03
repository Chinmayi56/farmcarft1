from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.user import User,UserRole
from app.models.product import Product
from app.models.order import Order,OrderStatus
from app.schemas.order import ReportSummary
from app.utils.dependencies import require_admin
router=APIRouter(prefix='/admin/reports',tags=['Reports'])
@router.get('/summary',response_model=ReportSummary)
def summary(db:Session=Depends(get_db),_:User=Depends(require_admin)):
    total=db.query(Order).count(); sales=db.query(func.coalesce(func.sum(Order.total_amount),0)).filter(Order.status!=OrderStatus.CANCELLED).scalar() or 0
    pending=db.query(Order).filter(Order.status==OrderStatus.PENDING).count(); customers=db.query(User).filter(User.role==UserRole.CUSTOMER).count(); products=db.query(Product).count(); low=db.query(Product).filter(Product.stock<=5).count()
    return {'total_orders':total,'total_sales':sales,'pending_orders':pending,'customers':customers,'products':products,'low_stock_products':low}
@router.get('/sales-by-status')
def sales_by_status(db:Session=Depends(get_db),_:User=Depends(require_admin)):
    return [{'status':s.value,'count':db.query(Order).filter(Order.status==s).count(),'sales':float(db.query(func.coalesce(func.sum(Order.total_amount),0)).filter(Order.status==s).scalar() or 0)} for s in OrderStatus]
