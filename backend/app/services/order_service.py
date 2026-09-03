import secrets, string, uuid
from decimal import Decimal
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session, joinedload
from app.models.order import Cart, CartItem, Order, OrderItem, OrderMethod, OrderStatus, PaymentMethod, PaymentStatus
from app.models.product import Product, ProductStatus
from app.models.user import User

def _code(prefix, n=8): return prefix + ''.join(secrets.choice(string.ascii_uppercase+string.digits) for _ in range(n))

_ORDER_METHOD_VALUES = {m.value for m in OrderMethod}

def _resolve_order_method(value):
    """Validate and resolve the customer-supplied order method. Missing/None
    defaults to the existing Cash on Delivery / standard delivery flow so
    older clients keep working. Anything that isn't a recognized
    OrderMethod value (e.g. an attempt to smuggle in an online-payment
    method) is rejected."""
    if value is None or value == '':
        return OrderMethod.DELIVERY
    v = str(value).strip().lower()
    if v not in _ORDER_METHOD_VALUES:
        raise ValueError('Invalid order method')
    return OrderMethod(v)
def get_or_create_cart(db, user_id):
    cart=db.query(Cart).filter(Cart.customer_id==user_id).first()
    if not cart:
        cart=Cart(customer_id=user_id); db.add(cart); db.flush()
    return cart

def cart_out(cart):
    items=[]; total=Decimal('0')
    for i in cart.items:
        p=i.product; price=p.discount_price if p.discount_price is not None else p.price; sub=price*i.quantity; total+=sub
        items.append({'id':i.id,'quantity':i.quantity,'product':{'id':p.id,'name':p.name,'sku':p.sku,'price':p.price,'discount_price':p.discount_price,'stock':p.stock,'image':p.image}})
    return {'id':cart.id,'items':items,'total':total}

def add_item(db,user_id,product_id,quantity):
    if quantity<=0: raise ValueError('Quantity must be greater than zero')
    cart=get_or_create_cart(db,user_id); p=db.get(Product,product_id)
    if not p: raise ValueError('Product not found')
    if p.status!=ProductStatus.ACTIVE: raise ValueError('Product is not available for purchase')
    item=next((x for x in cart.items if x.product_id==product_id),None)
    newq=(item.quantity if item else 0)+quantity
    if newq>p.stock: raise ValueError('Requested quantity exceeds available stock')
    if item: item.quantity=newq
    else: db.add(CartItem(cart_id=cart.id,product_id=p.id,quantity=quantity))
    db.commit(); db.refresh(cart); return cart

def update_item(db,user_id,item_id,quantity):
    if quantity<=0: raise ValueError('Quantity must be greater than zero')
    cart=get_or_create_cart(db,user_id); item=db.query(CartItem).filter(CartItem.id==item_id,CartItem.cart_id==cart.id).first()
    if not item: raise ValueError('Cart item not found')
    p=db.get(Product,item.product_id)
    if not p: raise ValueError('Product not found')
    if p.status!=ProductStatus.ACTIVE: raise ValueError('Product is not available for purchase')
    if quantity>p.stock: raise ValueError('Requested quantity exceeds available stock')
    item.quantity=quantity; db.commit(); db.refresh(cart); return cart

def remove_item(db,user_id,item_id):
    cart=get_or_create_cart(db,user_id); item=db.query(CartItem).filter(CartItem.id==item_id,CartItem.cart_id==cart.id).first()
    if not item: raise ValueError('Cart item not found')
    db.delete(item); db.commit(); db.refresh(cart); return cart

def clear_cart(db,user_id):
    cart=get_or_create_cart(db,user_id); cart.items=[]; db.commit(); db.refresh(cart); return cart

def create_order(db,user, payload):
    order_method=_resolve_order_method(getattr(payload,'order_method',None))
    cart=get_or_create_cart(db,user.id)
    if not cart.items: raise ValueError('Cart is empty')
    db.refresh(cart)
    total=Decimal('0'); rows=[]
    for item in list(cart.items):
        p=db.query(Product).filter(Product.id==item.product_id).with_for_update().first()
        if not p: raise ValueError('A product in your cart no longer exists')
        if p.status!=ProductStatus.ACTIVE: raise ValueError(f'{p.name} is no longer available for purchase')
        if item.quantity<=0: raise ValueError(f'Invalid quantity for {p.name}')
        if p.stock < item.quantity: raise ValueError(f'Insufficient stock for {p.name}')
        # Price is always taken from the database (discount_price if set,
        # otherwise price) — the client never supplies a price, so there is
        # nothing here for a manipulated client value to override.
        price=p.discount_price if p.discount_price is not None else p.price
        subtotal=price*item.quantity; total+=subtotal
        rows.append((p,item,price,subtotal))
    order=Order(order_number='FC-'+uuid.uuid4().hex[:10].upper(),purchase_code=_code('FC-'),customer_id=user.id,total_amount=total,shipping_address=payload.address,customer_snapshot={'id':str(user.id),'name':user.name,'email':user.email,'mobile':payload.mobile},order_method=order_method,payment_method=PaymentMethod.CASH_ON_DELIVERY,payment_status=PaymentStatus.PENDING,status=OrderStatus.PENDING)
    db.add(order); db.flush()
    for p,item,price,subtotal in rows:
        db.add(OrderItem(order_id=order.id,product_id=p.id,product_name=p.name,sku=p.sku,quantity=item.quantity,unit_price=price,subtotal=subtotal,configuration=payload.configuration))
        db.execute(text('SELECT decrement_product_stock(:pid, :qty)'), {'pid':p.id,'qty':item.quantity})
    cart.items=[]
    db.commit(); db.refresh(order)
    return db.query(Order).options(joinedload(Order.items)).filter(Order.id==order.id).first()

def list_orders(db,user=None):
    q=db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())
    if user: q=q.filter(Order.customer_id==user.id)
    return q.all()

def get_order(db,oid,user=None):
    q=db.query(Order).options(joinedload(Order.items)).filter(Order.id==oid)
    if user: q=q.filter(Order.customer_id==user.id)
    return q.first()
