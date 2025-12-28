```ts
// Example usage demonstration
hmu.configure({
  tokens: {
    brand: '#b410c6',
    error: '#f13a10',
    success: '#10f140',
  },

  levels: {
    log: {
      labelPrefixStyles: { color: '#888' },
      labelStyles: {},
      messageStyles: {},
    },
    error: {
      labelPrefixStyles: { color: '$error', fontWeight: 'bold' },
      labelStyles: {},
      messageStyles: { color: '#7f1d1d' },
    },
  },

  presets: {
    api: {
      level: 'info',
      icon: '🌐',
      prefix: 'API',
      labelPrefixStyles: {
        fontWeight: 'bold',
        color: 'white',
        background: '$brand',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
      },
      labelStyles: {
        color: '$brand',
        fontWeight: '600',
      },
      messageStyles: {},
    },

    db: {
      extends: 'api',
      icon: '🗄️',
      prefix: 'DB',
      labelPrefixStyles: {
        background: 'linear-gradient(90deg, #10b981, #059669)',
      },
    },
  },
});

// Usage examples:
console.log('\n=== Basic Usage ===');
hmu.log('Simple log');
hmu.error('Error message');

console.log('\n=== Preset Usage ===');
hmu.api('Fetching data');
hmu.api('POST /users', { id: 123, name: 'Alice' });
hmu.db('Query executed', { rows: 42 });

console.log('\n=== Chaining ===');
hmu.icon('👑').api('Custom icon');
hmu.icon('🔥').label('Critical').api({ error: 'Something broke' });
hmu.prefix('CUSTOM').label('Action').log('Custom prefix and label');

console.log('\n=== Mixed ===');
hmu.icon('⚡').db('Fast query', [1, 2, 3, 4, 5]);
```