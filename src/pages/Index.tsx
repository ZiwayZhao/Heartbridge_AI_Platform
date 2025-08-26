import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // 重定向到主页
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}