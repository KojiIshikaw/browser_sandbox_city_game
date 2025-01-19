// frontend/src/components/Hand.tsx
import React from 'react';

type Card = {
	id: number;
	name: string;
	cost: number;
	effect: () => void;
};

type HandProps = {
	cards: Card[];
	onSelect: (card: Card) => void;
};

const Hand: React.FC<HandProps> = ({ cards, onSelect }) => {
	return (
		<div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
			{cards.map(card => (
				<div
					key={card.id}
					onClick={() => onSelect(card)}
					style={{
						border: '1px solid #000',
						borderRadius: '5px',
						padding: '10px',
						cursor: 'pointer',
						minWidth: '100px',
						textAlign: 'center',
						backgroundColor: '#f0f0f0',
					}}
				>
					<h3>{card.name}</h3>
					<p>Cost: {card.cost}</p>
				</div>
			))}
		</div>
	);
};

export default Hand;
