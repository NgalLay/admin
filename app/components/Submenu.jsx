import { useState } from 'react';

const Submenu = ({ categories, onSelectCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    onSelectCategory(category);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryClick(category)}
          style={{
            padding: '10px',
            backgroundColor: selectedCategory === category ? '#007bff' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default Submenu;
