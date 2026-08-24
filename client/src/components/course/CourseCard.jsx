import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiBook, FiStar, FiUsers } from 'react-icons/fi';
import { formatPrice } from '../../utils/helpers';

const CourseCard = ({ course }) => {
  const {
    _id,
    title,
    instructor,
    thumbnail,
    price,
    discountPrice,
    isFree,
    level,
    category,
    totalDuration,
    rating,
    enrolledCount,
  } = course;

  return (
    <div 
      id={`course-card-${_id}`}
      className="card-glass" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#0d0f18' }}>
        <img 
          src={thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'} 
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{level}</span>
          {category && <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{category}</span>}
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
          {title}
        </h3>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Instructor: <span style={{ color: '#fff' }}>{instructor}</span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 'auto' }}>
          {totalDuration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiClock size={13} /> {totalDuration}
            </span>
          )}
          {enrolledCount && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiUsers size={13} /> {enrolledCount} enrolled
            </span>
          )}
          {rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ffb703', marginLeft: 'auto', fontWeight: 600 }}>
              <FiStar size={13} fill="#ffb703" /> {rating}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '0.25rem' }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isFree ? '#43e97b' : 'var(--primary)' }}>
              {isFree ? 'Free' : formatPrice(discountPrice || price)}
            </span>
            {!isFree && discountPrice && (
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                {formatPrice(price)}
              </span>
            )}
          </div>

          <Link to={`/courses/${_id}`} className="btn btn-sm btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
