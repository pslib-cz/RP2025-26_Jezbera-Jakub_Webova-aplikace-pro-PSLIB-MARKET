import React from 'react'
import type { SortOption } from '../components/SortButtons/SortButtons'

export const desktopSortIcons = {
  cheapest: (
    <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5625 0V1.39477H16.5247L7.94385 9.6489L4.68138 6.51066L0 11.0137L1.02532 12L4.68138 8.48313L7.94385 11.6214L17.55 2.38105V5.23039H19V0H13.5625Z" fill="currentColor" />
    </svg>
  ),
  expensive: (
    <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5625 12V10.6052H16.5247L7.94385 2.35111L4.68137 5.48934L0 0.986277L1.02532 0L4.68137 3.51687L7.94385 0.378636L17.55 9.61895V6.76961L19 6.76961V12H13.5625Z" fill="currentColor" />
    </svg>
  ),
  newest: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.75 7.41667H20.75M5.19444 0.75V2.97222M16.3056 0.75V2.97222M4.08333 10.75H8.52778V15.1944H4.08333V10.75ZM4.30556 20.75H17.1944C18.439 20.75 19.0613 20.75 19.5367 20.5078C19.9548 20.2948 20.2948 19.9548 20.5078 19.5367C20.75 19.0613 20.75 18.439 20.75 17.1944V6.52778C20.75 5.28321 20.75 4.66093 20.5078 4.18558C20.2948 3.76743 19.9548 3.42748 19.5367 3.21443C19.0613 2.97222 18.439 2.97222 17.1944 2.97222H4.30556C3.061 2.97222 2.43871 2.97222 1.96336 3.21443C1.54521 3.42748 1.20526 3.76743 0.992211 4.18558C0.75 4.66093 0.75 5.28321 0.75 6.52778V17.1944C0.75 18.439 0.75 19.0613 0.992211 19.5367C1.20526 19.9548 1.54521 20.2948 1.96336 20.5078C2.43871 20.75 3.06099 20.75 4.30556 20.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  oldest: (
    <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.17594 7.97892L5.24407 6.91075C5.56952 6.5853 6.09715 6.5853 6.42259 6.91075C6.74802 7.23617 6.74802 7.76383 6.42259 8.08925L3.92259 10.5892C3.76631 10.7455 3.55435 10.8333 3.33333 10.8333C3.11232 10.8333 2.90036 10.7455 2.74407 10.5892L0.244078 8.08925C-0.0813593 7.76383 -0.0813593 7.23617 0.244078 6.91075C0.569515 6.5853 1.09715 6.5853 1.42259 6.91075L2.50676 7.99492C2.68432 3.54944 6.34432 0 10.8333 0C15.4358 0 19.1667 3.73096 19.1667 8.33333C19.1667 12.9357 15.4358 16.6667 10.8333 16.6667C8.21515 16.6667 5.87858 15.4582 4.3522 13.572C4.06269 13.2142 4.11803 12.6895 4.47581 12.4C4.83357 12.1105 5.35831 12.1658 5.64782 12.5236C6.87136 14.0356 8.73942 15 10.8333 15C14.5153 15 17.5 12.0153 17.5 8.33333C17.5 4.65143 14.5153 1.66667 10.8333 1.66667C7.27035 1.66667 4.36018 4.46177 4.17594 7.97892ZM10.8333 2.5C11.2936 2.5 11.6667 2.8731 11.6667 3.33333V7.98817L13.9226 10.2441C14.248 10.5695 14.248 11.0972 13.9226 11.4226C13.5972 11.748 13.0695 11.748 12.7441 11.4226L10.2441 8.92258C10.0878 8.76633 10 8.55433 10 8.33333V3.33333C10 2.8731 10.3731 2.5 10.8333 2.5Z" fill="currentColor" />
    </svg>
  ),
}

export const mobileSortOptions: Array<{ value: SortOption; label: string; icon: React.ReactNode }> = [
  {
    value: 'priceAsc',
    label: 'Nejlevnější',
    icon: (
      <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M2 9.5L4.4 7.1L6.2 8.9L11 4.1' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M9 4H11V6' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    ),
  },
  {
    value: 'priceDesc',
    label: 'Nejdražší',
    icon: (
      <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M2 4.5L4.4 6.9L6.2 5.1L11 9.9' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M9 10H11V8' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    ),
  },
  {
    value: 'newest',
    label: 'Nejnovější',
    icon: (
      <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M7 3V7L9.5 8.5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='7' cy='7' r='5' stroke='currentColor' />
      </svg>
    ),
  },
  {
    value: 'oldest',
    label: 'Nejstarší',
    icon: (
      <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M7 3V7L4.5 8.5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='7' cy='7' r='5' stroke='currentColor' />
      </svg>
    ),
  },
]
