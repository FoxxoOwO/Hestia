import '@testing-library/jest-dom/vitest';

// jsdom nemá implementované createObjectURL – pouze testově.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}
