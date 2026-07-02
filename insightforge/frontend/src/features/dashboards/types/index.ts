export interface Widget {
  id: string;
  dashboard_id: string;
  dataset_id: string;
  title: string;
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  x_axis: string;
  y_axis: string;
  aggregate_func?: string;
  color_palette?: string;
  layout_x: number;
  layout_y: number;
  layout_w: number;
  layout_h: number;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
  widgets: Widget[];
}

export interface WidgetDataResponse {
  widget_id: string;
  data: Array<Record<string, any>>;
}
