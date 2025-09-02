#!/usr/bin/env node

// Simple runner script for updating generic descriptions
import('./updateGenericDescriptions.js')
  .then(() => {
    console.log('Description update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running description update:', error);
    process.exit(1);
  });