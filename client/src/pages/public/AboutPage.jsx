import React from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiCheckCircle, FiBookOpen, FiUsers, FiYoutube, FiArrowRight } from 'react-icons/fi';

const AboutPage = () => {
  return (
    <div>
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '5rem 0', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', padding: '0.35rem 0.9rem', borderRadius: '20px', color: 'var(--primary-dark)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            <FiAward /> SIDD ACADEMY PRAYAGRAJ • UP BOARD & NCERT
          </div>
          <h1 className="text-gradient" style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', marginBottom: '1rem', fontWeight: 800 }}>
            About Sidd Academy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Empowering Class 10th, 11th & 12th students across Uttar Pradesh and India with structured NCERT & Board-focused video lectures, handwritten topper notes, and personal mentorship.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '4.5rem 0' }}>
        <div className="grid-2" style={{ alignItems: 'center', gap: '3.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', fontWeight: 800 }}>Our Mission & Pedagogy</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
              At <strong>Sidd Academy Prayagraj</strong>, we believe that high-quality board and competitive foundation education should be accessible to every Hindi-medium and English-medium student. Our mission is to bridge the gap between classroom rigor and digital convenience through structured courses, live doubt resolution, and cloud-hosted PDF study materials.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Every subject is organized chapter-by-chapter with high-definition video lectures, formula cheat-sheets, and previous 10-year board exam solutions so students can study systematically and score 95%+ in their board examinations.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/courses" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Explore Courses <FiArrowRight />
              </Link>
              <a
                href="https://www.youtube.com/@Sidacademyprayagraj"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FiYoutube style={{ color: '#dc2626' }} /> @Sidacademyprayagraj
              </a>
            </div>
          </div>

          <div className="card-glass" style={{ padding: '2rem', borderRadius: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.3rem', fontWeight: 700 }}>Our Core Values</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FiCheckCircle style={{ color: 'var(--primary)', flexShrink: 0 }} size={20} />
                <span><strong>Excellence in Board Preparation:</strong> 100% NCERT & UP Board syllabus alignment.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FiCheckCircle style={{ color: 'var(--secondary)', flexShrink: 0 }} size={20} />
                <span><strong>Student-Centric Mentorship:</strong> Easy-to-grasp explanations in simple language.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FiCheckCircle style={{ color: 'var(--accent-dark)', flexShrink: 0 }} size={20} />
                <span><strong>Modular PDF Study Notes:</strong> Subject &rarr; Chapter &rarr; Handwritten PDFs accessible anytime in the Student Portal.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FiCheckCircle style={{ color: 'var(--primary-dark)', flexShrink: 0 }} size={20} />
                <span><strong>Affordability & Access:</strong> High-impact batches & free YouTube lecture series for all students.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '4.5rem 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 800 }}>Meet Our Expert Faculty Team</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            Dedicated educators from Prayagraj guiding thousands of students toward top ranks in Class 10th, 11th & 12th Board Exams.
          </p>
          <div className="card" style={{ maxWidth: '720px', margin: '0 auto', overflow: 'hidden', borderRadius: '18px' }}>
            <div style={{ backgroundColor: '#0b0e1a' }}>
              <img
                src="/posters/sid-academy-faculty-team.jpg"
                alt="Sidd Academy Prayagraj Faculty Team — Siddhant Pandey, Aakash Sir & Shahzad Sir"
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
            </div>
            <div style={{ padding: '1.75rem 2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.45rem', marginBottom: '0.35rem', fontWeight: 800 }}>
                Siddhant Pandey, आकाश सर (Aakash Sir) & शहजाद सर (Shahzad Sir)
              </h3>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Founders & Lead Subject Educators • SIDD ACADEMY PRAYAGRAJ
              </p>
              <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Specializing in Physics, Chemistry, Biology, Mathematics, and English Grammar with a proven track record of producing board toppers in Prayagraj.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
