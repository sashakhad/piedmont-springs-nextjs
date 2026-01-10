import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExampleForm } from '../ExampleForm';
import React from 'react';

describe('ExampleForm', () => {
  it('renders the form title and submit button', () => {
    render(<ExampleForm />);
    expect(screen.getByText(/example form/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});
