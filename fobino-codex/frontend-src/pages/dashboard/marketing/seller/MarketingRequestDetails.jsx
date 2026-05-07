import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Redirect to new detail page
export default function MarketingRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/dashboard/marketing/my-requests/${id}`, { replace: true });
  }, [id, navigate]);


  return null;
}
