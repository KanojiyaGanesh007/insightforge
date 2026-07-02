"""SQLAlchemy models for dashboards and widgets."""

import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.mixins import SoftDeleteMixin, TenantMixin, TimestampMixin


class Dashboard(Base, TimestampMixin, SoftDeleteMixin, TenantMixin):
    __tablename__ = "dashboards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_auto_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    widgets: Mapped[list["DashboardWidget"]] = relationship(
        back_populates="dashboard",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class DashboardWidget(Base, TimestampMixin):
    __tablename__ = "dashboard_widgets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dashboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dashboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    chart_type: Mapped[str] = mapped_column(String(50), nullable=False)  # bar, line, pie, scatter, area
    x_axis: Mapped[str] = mapped_column(String(100), nullable=False)
    y_axis: Mapped[str] = mapped_column(String(100), nullable=False)
    aggregate_func: Mapped[str | None] = mapped_column(String(50), nullable=True)  # sum, avg, count, min, max
    color_palette: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Layout positioning (for grid engines)
    layout_x: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    layout_y: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    layout_w: Mapped[int] = mapped_column(Integer, default=6, nullable=False)
    layout_h: Mapped[int] = mapped_column(Integer, default=4, nullable=False)

    dashboard: Mapped["Dashboard"] = relationship(back_populates="widgets", lazy="raise")
    dataset = relationship("Dataset", lazy="selectin")
