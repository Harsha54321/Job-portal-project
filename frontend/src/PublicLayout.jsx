// src/PublicLayout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import ScrollToTop from './ScrollToTop'

const PublicLayout = () => {
  // No inactivity logout hook here - public pages don't need auto-logout
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  )
}

export default PublicLayout