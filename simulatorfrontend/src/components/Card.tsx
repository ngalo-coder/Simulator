import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <div
      className="bg-white dark:bg-background-dark rounded-lg shadow-md p-6"
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;