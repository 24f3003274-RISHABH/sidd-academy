import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiBook, FiStar, FiUsers } from 'react-icons/fi';
import { formatPrice, getEffectivePrice } from '../../utils/helpers';

const CourseCard = ({ course }) => {
  const {
    _id,
    id,
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
  const courseId = _id || id;
  const effectivePrice = getEffectivePrice({ price, discountPrice, isFree: isFree === true });
  const originalPrice = Number(price);
  const discountedPrice = Number(discountPrice);
  const isFreeCourse = effectivePrice <= 0;
  const hasDiscount = Number.isFinite(originalPrice)
    && Number.isFinite(discountedPrice)
    && discountedPrice > 0
    && discountedPrice < originalPrice;

  return (
    <div 
      id={`course-card-${courseId}`}
      className="course-card card-glass" 
      style={{
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div className="course-card-media">
        <img 
          src={thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'} 
          alt={title}
          className="course-card-image"
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{level}</span>
          {category && <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{category}</span>}
        </div>
      </div>

      <div className="course-card-body" style={{ gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
          {title}
        </h3>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Instructor: <span style={{ color: 'var(--text-primary)' }}>{instructor}</span>
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

        <div className="course-card-footer" style={{ marginTop: '0.25rem' }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isFreeCourse ? '#43e97b' : 'var(--primary)' }}>
              {isFreeCourse ? 'Free' : formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                {formatPrice(price)}
              </span>
            )}
          </div>

          <Link to={`/courses/${courseId}`} className="btn btn-sm btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
