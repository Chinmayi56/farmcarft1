import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from app.models.order import OrderStatus, OrderMethod, PaymentMethod, PaymentStatus
class CartItemAdd(BaseModel): product_id: uuid.UUID; quantity: int=Field(ge=1)
class CartItemUpdate(BaseModel): quantity: int=Field(ge=1)
class CartProductOut(BaseModel): id: uuid.UUID; name: str; sku: str; price: Decimal; discount_price: Decimal|None=None; stock: int; image: str|None=None
class CartItemOut(BaseModel): id: uuid.UUID; quantity:int; product:CartProductOut
class CartOut(BaseModel): id:uuid.UUID; items:list[CartItemOut]; total:Decimal
class OrderCreate(BaseModel):
    address: dict
    mobile: str|None=None
    configuration: str|None=None
    # How the customer wants to complete the order. Accepts the
    # OrderMethod values ("delivery" for the existing Cash on Delivery
    # flow, "visit_company" for the new Visit Company flow). Defaults to
    # "delivery" so existing clients that don't send this field keep
    # working unchanged. This is NOT a payment method / gateway field.
    order_method: str|None=None
class OrderItemOut(BaseModel): id:uuid.UUID; product_id:uuid.UUID; product_name:str; sku:str; quantity:int; unit_price:Decimal; subtotal:Decimal; configuration:str|None=None
class OrderOut(BaseModel):
    id:uuid.UUID; order_number:str; purchase_code:str; customer_id:uuid.UUID; status:OrderStatus; order_method:OrderMethod; payment_method:PaymentMethod; payment_status:PaymentStatus; total_amount:Decimal; shipping_address:dict; customer_snapshot:dict; created_at:datetime; updated_at:datetime; items:list[OrderItemOut]
    model_config={'from_attributes':True}
class OrderStatusUpdate(BaseModel): status: OrderStatus
class StockAdjust(BaseModel): quantity_change:int; reason:str=Field(min_length=1,max_length=100)
class StockOut(BaseModel): product_id:uuid.UUID; stock:int
class ReportSummary(BaseModel): total_orders:int; total_sales:Decimal; pending_orders:int; customers:int; products:int; low_stock_products:int
