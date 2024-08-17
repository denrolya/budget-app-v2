import { render, screen } from '@testing-library/react';

import ExampleComponent from './Example';

test('renders ExampleComponent', () => {
  render(<ExampleComponent title="Test Title" />);
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  expect(screen.getByText('This is an example component using Tailwind CSS and Font Awesome.')).toBeInTheDocument();
  expect(screen.getByText('Done!')).toBeInTheDocument();
});
