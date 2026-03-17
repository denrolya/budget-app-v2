import React from 'react';
import { useNavigate } from 'react-router-dom';

import AccountsAnalyticsPanel from '../components/analytics/AccountsAnalyticsPanel';

const AccountsIndexPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full min-h-0">
      <AccountsAnalyticsPanel onNavigate={(id) => navigate(`/accounts/${id}`)} />
    </div>
  );
};

export default AccountsIndexPage;
