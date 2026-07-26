function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== '');
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function parseBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = /^[*-]\s+(.*)$/.exec(line);
    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line);

    if (bulletMatch || orderedMatch) {
      const listType = bulletMatch ? 'ul' : 'ol';
      const itemText = bulletMatch ? bulletMatch[1] : orderedMatch[1];
      if (!currentList || currentList.type !== listType) {
        currentList = { type: listType, items: [] };
        blocks.push(currentList);
      }
      currentList.items.push(itemText);
      continue;
    }

    currentList = null;
    if (line === '') continue;
    blocks.push({ type: 'p', text: line });
  }

  return blocks;
}

export function MarkdownLite({ text }) {
  const blocks = parseBlocks(text);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'ul' || block.type === 'ol') {
          const ListTag = block.type;
          return (
            <ListTag key={i} className="md-list">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </ListTag>
          );
        }
        return <p key={i}>{renderInline(block.text, `${i}`)}</p>;
      })}
    </>
  );
}
