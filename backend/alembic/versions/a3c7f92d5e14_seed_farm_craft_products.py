"""seed initial Farm Craft catalog products

The `products` table has existed since `c3d9a1f4e857_add_products_table`
but nothing has ever populated it, so the Customer storefront (which
reads exclusively from PostgreSQL via `GET /api/products` — see
`customer/src/services.js`, never from mock data) has had no real
products to show.

This migration seeds a starter catalog covering each of the Customer
frontend's six categories (`customer/src/data.js` CATEGORIES: category
values below are the same slug ids that page filters on, e.g.
`?category=transferring`), using the existing images already bundled
under `customer/public/assets/products/` so no new image assets are
required.

Safety:
- Idempotent: each row is only inserted if a product with the same SKU
  does not already exist, so re-running this against a database that
  already has these rows (or where an admin already created a product
  with one of these SKUs) is a no-op for that row.
- Never drops or truncates the `products` table, and never touches any
  row it didn't insert itself.
- All seeded products use status="active" (the lowercase value the
  `product_status` enum actually stores — see
  `f1a6c8e2b933_normalize_product_status_enum`), so they are visible to
  the Customer storefront immediately.

Revision ID: a3c7f92d5e14
Revises: f1a6c8e2b933
Create Date: 2026-09-02 01:00:00.000000

"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a3c7f92d5e14"
down_revision: Union[str, None] = "f1a6c8e2b933"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


product_status_enum = postgresql.ENUM(
    "active", "draft", "out of stock", name="product_status", create_type=False
)

products_table = sa.table(
    "products",
    sa.column("id", postgresql.UUID(as_uuid=True)),
    sa.column("name", sa.String),
    sa.column("category", sa.String),
    sa.column("sku", sa.String),
    sa.column("price", sa.Numeric),
    sa.column("discount_price", sa.Numeric),
    sa.column("stock", sa.Integer),
    sa.column("description", sa.Text),
    sa.column("status", product_status_enum),
    sa.column("image", sa.Text),
    sa.column("images", postgresql.ARRAY(sa.Text())),
    sa.column("motor", sa.String),
    sa.column("capacity", sa.String),
    sa.column("length", sa.String),
    sa.column("height", sa.String),
    sa.column("pipe_material", sa.String),
    sa.column("screw_material", sa.String),
    sa.column("usage", sa.Text),
    sa.column("features", postgresql.ARRAY(sa.Text())),
    sa.column("applications", postgresql.ARRAY(sa.Text())),
    sa.column("created_at", sa.DateTime(timezone=True)),
    sa.column("updated_at", sa.DateTime(timezone=True)),
)

_ASSET = "assets/products/{}.jpeg"

# Fixed ids/SKUs so this migration is stable and self-identifying on
# downgrade — every row it may have inserted is looked up by SKU, never
# by a broader/heuristic match.
_SEED_PRODUCTS = [
    {
        "id": "fc3b48a0-6444-4f38-9a1e-107c37f8931c",
        "name": "Grain Transferring Pipe — 100 ft",
        "category": "transferring",
        "sku": "FC-PIPE-100",
        "price": 42000,
        "discount_price": 37999,
        "stock": 24,
        "description": (
            "Flexible, motor-driven grain transferring pipe for moving rice, "
            "wheat, corn and soybean between trucks, stores and processing "
            "points over long distances with far less manual handling."
        ),
        "image": _ASSET.format("pipe-coil-1"),
        "images": [_ASSET.format("pipe-coil-1"), _ASSET.format("pipe-mounted-1")],
        "motor": "5 HP to 16 HP",
        "capacity": "18 tons per hour",
        "length": "100 feet",
        "height": "20 feet transfer height",
        "pipe_material": "Reinforced flexible PVC",
        "screw_material": "Galvanized steel",
        "usage": "Farm-to-store and truck-to-store grain transfer.",
        "features": [
            "Heavy-duty long-distance grain transfer",
            "Coils compactly for storage and transport",
            "Compatible with 5–16 HP motor options",
        ],
        "applications": ["Rice", "Wheat", "Corn", "Soybean"],
    },
    {
        "id": "84c15c95-e5f6-4cd5-9285-49f954f5dce5",
        "name": "Grain Transferring Pipe — 250 ft",
        "category": "transferring",
        "sku": "FC-PIPE-250",
        "price": 68500,
        "discount_price": None,
        "stock": 12,
        "description": (
            "Extended-length version of our flexible grain transferring pipe "
            "for larger stores and mills that need to move grain across "
            "longer spans in a single run."
        ),
        "image": _ASSET.format("pipe-coil-2"),
        "images": [_ASSET.format("pipe-coil-2"), _ASSET.format("pipe-studio-1")],
        "motor": "8 HP to 16 HP",
        "capacity": "16 tons per hour",
        "length": "250 feet",
        "height": "20 feet transfer height",
        "pipe_material": "Reinforced flexible PVC",
        "screw_material": "Galvanized steel",
        "usage": "Large-store and mill grain transfer over long spans.",
        "features": [
            "Long-span single-run transfer",
            "Reinforced coil resists kinking",
            "Fits fixed or wheeled mounting frames",
        ],
        "applications": ["Rice", "Wheat", "Corn", "Millet"],
    },
    {
        "id": "8a0a8fd9-3f41-4da4-93db-97fc5670039f",
        "name": "Grain Collector — Track Mounted",
        "category": "collecting",
        "sku": "FC-COLL-TRK",
        "price": 118000,
        "discount_price": 104999,
        "stock": 8,
        "description": (
            "Track-mounted grain collector that gathers loose grain from "
            "threshing floors and open yards, feeding it into an inclined "
            "elevator to cut manual scooping."
        ),
        "image": _ASSET.format("collector-field"),
        "images": [_ASSET.format("collector-field"), _ASSET.format("collector-diagram")],
        "motor": "10 HP",
        "capacity": "12 tons per hour",
        "length": None,
        "height": "Adjustable incline elevator",
        "pipe_material": None,
        "screw_material": "Steel auger",
        "usage": "Threshing-floor and open-yard grain recovery.",
        "features": [
            "Stable movement across loose grain heaps",
            "Adjustable-incline elevator",
            "Handles rice, corn, wheat and soybean",
        ],
        "applications": ["Rice", "Corn", "Wheat", "Soybean"],
    },
    {
        "id": "c253c5f7-af69-4446-8d34-a83a2020cc9e",
        "name": "Grain Collector — Wheeled",
        "category": "collecting",
        "sku": "FC-COLL-WHL",
        "price": 89000,
        "discount_price": None,
        "stock": 15,
        "description": (
            "Wheeled grain collector for smaller yards, offering the same "
            "inclined-elevator recovery in a lighter, easier-to-move frame."
        ),
        "image": _ASSET.format("collector-diagram"),
        "images": [_ASSET.format("collector-diagram"), _ASSET.format("collector-field")],
        "motor": "7.5 HP",
        "capacity": "8 tons per hour",
        "length": None,
        "height": "Adjustable incline elevator",
        "pipe_material": None,
        "screw_material": "Steel auger",
        "usage": "Small-to-mid yard grain recovery.",
        "features": [
            "Lightweight wheeled frame",
            "Easy to reposition across a yard",
            "Adjustable-incline elevator",
        ],
        "applications": ["Rice", "Corn", "Wheat"],
    },
    {
        "id": "7f8b6594-8c68-4266-9890-cbf4b7b8bb81",
        "name": "Grain Bagging Attachment",
        "category": "bagging",
        "sku": "FC-BAG-STD",
        "price": 34500,
        "discount_price": 29999,
        "stock": 20,
        "description": (
            "Bagging attachment that pairs with any Farm Craft collector "
            "unit for consistent fill weight and quick bag changeovers, "
            "standard 50 kg woven bag compatible."
        ),
        "image": _ASSET.format("collector-bags"),
        "images": [_ASSET.format("collector-bags")],
        "motor": "2 HP",
        "capacity": "90 bags per hour",
        "length": None,
        "height": None,
        "pipe_material": None,
        "screw_material": None,
        "usage": "Fast, consistent bag-filling for grains and powders.",
        "features": [
            "Up to 90 bags per hour",
            "Standard 50 kg woven bag compatibility",
            "Consistent fill weight across bags",
        ],
        "applications": ["Rice", "Wheat", "Powders"],
    },
    {
        "id": "e9d8a74b-de92-4210-852c-01d63d8704fe",
        "name": "Grain Handling System — Complete",
        "category": "handling",
        "sku": "FC-HAND-SYS",
        "price": 245000,
        "discount_price": 219999,
        "stock": 5,
        "description": (
            "Complete grain handling system combining collection, transfer "
            "and bagging into one configured setup, sized to a mid-size "
            "farm or mill's daily volume."
        ),
        "image": _ASSET.format("pipe-frame"),
        "images": [_ASSET.format("pipe-frame"), _ASSET.format("pipe-mounted-2")],
        "motor": "16 HP",
        "capacity": "18 tons per hour",
        "length": "150 feet",
        "height": "20 feet transfer height",
        "pipe_material": "Reinforced flexible PVC",
        "screw_material": "Galvanized steel",
        "usage": "Whole-operation grain handling for mid-size farms and mills.",
        "features": [
            "Combines transfer, collection and bagging",
            "Sized to daily mill/farm volume",
            "Fixed or wheeled mounting options",
        ],
        "applications": ["Rice", "Wheat", "Corn", "Soybean"],
    },
    {
        "id": "2fc3fc38-028e-4db1-be8b-09ba6dd17fea",
        "name": "Farm Craft Multi-Crop Loader",
        "category": "machinery",
        "sku": "FC-MACH-LDR",
        "price": 156000,
        "discount_price": None,
        "stock": 6,
        "description": (
            "General-purpose agricultural machine that loads and elevates "
            "multiple crop types, configurable with motor, mounting and "
            "accessory options to fit your operation."
        ),
        "image": _ASSET.format("pipe-studio-1"),
        "images": [_ASSET.format("pipe-studio-1"), _ASSET.format("collector-diagram")],
        "motor": "5 HP to 16 HP",
        "capacity": "Configurable to operation",
        "length": None,
        "height": None,
        "pipe_material": None,
        "screw_material": None,
        "usage": "Configurable loading for varied farm and mill operations.",
        "features": [
            "Configurable motor, pipe and mounting options",
            "Sized to grain type and daily volume",
            "One-point setup with Farm Craft support",
        ],
        "applications": ["Rice", "Wheat", "Corn", "Soybean", "Millet"],
    },
    {
        "id": "da53e324-9953-4abf-9a28-0efc74e766ed",
        "name": "Grain Pipe Mounting & Accessory Kit",
        "category": "accessories",
        "sku": "FC-ACC-KIT",
        "price": 12500,
        "discount_price": 10999,
        "stock": 40,
        "description": (
            "Mounting brackets, coupling joints and spare pipe sections for "
            "Farm Craft grain transferring pipes — keep a spare on hand for "
            "quick field repairs and reconfiguration."
        ),
        "image": _ASSET.format("pipe-mounted-2"),
        "images": [_ASSET.format("pipe-mounted-2"), _ASSET.format("pipe-coil-1")],
        "motor": None,
        "capacity": None,
        "length": "10 feet spare section",
        "height": None,
        "pipe_material": "Reinforced flexible PVC",
        "screw_material": "Galvanized steel",
        "usage": "Spares and mounting hardware for existing Farm Craft pipes.",
        "features": [
            "Fits standard Farm Craft pipe diameters",
            "Includes mounting brackets and coupling joints",
            "Handy for quick field repairs",
        ],
        "applications": ["Maintenance", "Field repair"],
    },
]


def upgrade() -> None:
    bind = op.get_bind()

    seed_skus = [p["sku"] for p in _SEED_PRODUCTS]
    existing = {
        row[0]
        for row in bind.execute(
            sa.select(products_table.c.sku).where(products_table.c.sku.in_(seed_skus))
        )
    }

    now = datetime.now(timezone.utc)
    rows_to_insert = [
        {
            "id": uuid.UUID(p["id"]),
            "name": p["name"],
            "category": p["category"],
            "sku": p["sku"],
            "price": p["price"],
            "discount_price": p["discount_price"],
            "stock": p["stock"],
            "description": p["description"],
            "status": "active",
            "image": p["image"],
            "images": p["images"],
            "motor": p["motor"],
            "capacity": p["capacity"],
            "length": p["length"],
            "height": p["height"],
            "pipe_material": p["pipe_material"],
            "screw_material": p["screw_material"],
            "usage": p["usage"],
            "features": p["features"],
            "applications": p["applications"],
            "created_at": now,
            "updated_at": now,
        }
        for p in _SEED_PRODUCTS
        if p["sku"] not in existing
    ]

    if rows_to_insert:
        op.bulk_insert(products_table, rows_to_insert)


def downgrade() -> None:
    # Deleting by SKU alone is unsafe: if a product with one of these SKUs
    # already existed before this migration ran (e.g. an admin-created
    # product), upgrade() would have skipped inserting a row for that SKU,
    # but a SKU-only delete here would still remove that pre-existing row.
    #
    # Each seed row's id is a fixed UUID chosen by this migration and used
    # only for rows it inserts itself, so requiring BOTH id and sku to match
    # a seed entry ensures we only ever delete rows this migration actually
    # inserted. A pre-existing/admin-created row with a matching SKU has a
    # different id and is therefore never touched.
    conditions = [
        sa.and_(
            products_table.c.id == uuid.UUID(p["id"]),
            products_table.c.sku == p["sku"],
        )
        for p in _SEED_PRODUCTS
    ]
    op.execute(products_table.delete().where(sa.or_(*conditions)))
