// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react';
import { createPortal } from 'react-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data
const data = [
  { name: 'Jan', uv: 4000 },
  { name: 'Feb', uv: 3000 },
  { name: 'Mar', uv: 2000 },
  { name: 'Apr', uv: 2780 },
  { name: 'May', uv: 1890 },
  { name: 'Jun', uv: 2390 },
  { name: 'Jul', uv: 3490 },
  { name: 'Jan', uv: 4000 },
  { name: 'Feb', uv: 3000 },
  { name: 'Mar', uv: 2000 },
  { name: 'Apr', uv: 2780 },
  { name: 'May', uv: 1890 },
  { name: 'Jun', uv: 2390 },
  { name: 'Jul', uv: 3490 },
  { name: 'Jan', uv: 4000 },
  { name: 'Feb', uv: 3000 },
  { name: 'Mar', uv: 2000 },
  { name: 'Apr', uv: 2780 },
  { name: 'May', uv: 1890 },
  { name: 'Jun', uv: 2390 },
  { name: 'Jul', uv: 3490 },
];

// Custom tooltip content using a portal for positioning outside the chart bounds
const CustomTooltip = ({ active, payload, label, coordinate }) => {
  if (active && payload && payload.length) {
    // Get the mouse position for tooltip placement
    const { x, y } = coordinate;

    return createPortal(
      <div
        style={{ top: y, left: x }}
        className="absolute z-50 bg-white p-4 border border-gray-300 rounded shadow-lg pointer-events-none"
      >
        <h4 className="font-bold mb-2">Details for {label}</h4>
        <ul className="space-y-2">
          {/* Simulating a lot of content */}
          <li><strong>Value:</strong> {payload[0].value}</li>
          <li><strong>Additional Info 1:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 2:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 3:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 4:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 1:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 2:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 3:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 4:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 1:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 2:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 3:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 4:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 1:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 2:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 3:</strong> Some extra detail here...</li>
          <li><strong>Additional Info 4:</strong> Some extra detail here...</li>
          {/* More content to simulate "a lot" */}
        </ul>
      </div>,
      document.body, // Render the tooltip in the body to escape container bounds
    );
  }

  return null;
};

const MyBarChart = () => (
  <Card className="p-4 relative">
    <CardHeader>
      <CardTitle>Money Flow</CardTitle>
    </CardHeader>
    <CardContent className="overflow-x-auto">
    {/* Setting a min-width to ensure bars don't get too squeezed on smaller screens */}
      <div className="min-w-[600px]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="uv" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export default MyBarChart;
