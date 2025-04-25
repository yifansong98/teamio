import React from 'react';
import SankeyChart from './SankeyChart';
import styles from './WorkExplanation.module.css';   // same CSS as others

export default function SankeyExplanation({ onClose }) {
  /* ------------------------------------------------------------------ *
   *  “Sparse / unhealthy” example                                       *
   *                                                                     *
   *  • Members 1 ⇄ 2 exchange a few comments (values 2 and 1).          *
   *  • Members 3 & 4 appear but contribute nothing.  To keep them       *
   *    visible, we add tiny self‑links (value 0.1) that render as       *
   *    hair‑line rectangles yet give the nodes a height > 0.            *
   * ------------------------------------------------------------------ */
  const sparseLinks = [
    { i: 0, j: 1, value: 2 },   // 1 ➜ 2
    { i: 1, j: 0, value: 1 },   // 2 ➜ 1
    { i: 2, j: 2, value: 1 }, // 3 no real feedback
    { i: 3, j: 3, value: 1 }  // 4 no real feedback
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 style={{ marginBottom: 12 }}>Inclusive Feedback Patterns</h2>

        <p style={{ lineHeight: 1.55, textAlign: 'left', maxWidth: 640 }}>
          Strong teams <strong>regularly review and comment on one
          another’s work</strong>. Constructive feedback broadens
          perspectives, surfaces issues early, and helps everyone align
          on shared goals. When feedback flows only between a small
          subset of members, the team risks “silos” and missed learning
          opportunities.
        </p>

        <h3 style={{ marginTop: 28, marginBottom: 10, fontSize: 17 }}>
          Sparse feedback pattern&nbsp;(not recommended)
        </h3>

        <SankeyChart
          width={460}
          height={320}
          rawLinks={sparseLinks}
          showMyData={false}
          currentUserLeftIndex={0}  /* dummy */
          currentUserRightIndex={4} /* dummy */
        />

        <p style={{ marginTop: 10, fontSize: 14, color: '#555' }}>
          Only a small exchange between two members is visible; other
          teammates give or receive virtually no comments. Aim for
          feedback that flows among <em>all</em> team members.
        </p>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
