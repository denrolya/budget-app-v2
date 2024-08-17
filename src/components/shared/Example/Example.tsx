import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface ExampleComponentProps {
  title: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ title }) => {
  return (
    <div className="bg-blue-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="mb-2">This is an example component using Tailwind CSS and Font Awesome.</p>
      <FontAwesomeIcon icon={faCheck} className="text-green-500" /> Done!
    </div>
  );
};

export default ExampleComponent;
