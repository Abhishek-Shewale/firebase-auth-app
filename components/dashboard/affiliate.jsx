'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function Affiliate() {
  const { user } = useAuth();
  const [affiliateData, setAffiliateData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get-affiliate-data?uid=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setAffiliateData(data);
        if (data?.code) {
          await loadAffiliateOrders(data.code);
        }
      }
    } catch (error) {
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateOrders = async (affiliateCode) => {
    try {
      const response = await fetch(`/api/get-affiliate-orders?code=${affiliateCode}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    }
  };

  const generateAffiliateCode = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/generate-affiliate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      if (response.ok) {
        toast.success("Affiliate code generated!");
        await loadAffiliateData();
      } else {
        toast.error("Failed to generate code");
      }
    } finally {
      setGenerating(false);
    }
  };

  const deleteAffiliateLink = async () => {
    try {
      const response = await fetch('/api/delete-affiliate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      if (response.ok) {
        toast.success("Affiliate link deleted!");
        setAffiliateData(null);
      } else {
        toast.error("Failed to delete link");
      }
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    toast.success("Affiliate link copied to clipboard!");
  };

  if (loading) return <p>Loading...</p>;

  if (!affiliateData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Become an Affiliate</CardTitle>
          <CardDescription>Generate your affiliate code</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateAffiliateCode}
            disabled={generating}
            className="cursor-pointer"
          >
            {generating ? 'Generating...' : 'Generate Affiliate Code'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Code</CardTitle>
          <CardDescription>You earn <span className="font-bold">10%</span> commission on each sale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{affiliateData.code}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => copyToClipboard(affiliateData.link)}
            >
              Copy Link
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={deleteAffiliateLink}
            >
              Delete Link
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Your Affiliate Link:</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 cursor-pointer"
                onClick={() => copyToClipboard(affiliateData.link)}>
                {affiliateData.link}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => copyToClipboard(affiliateData.link)}
              >
                Copy
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referred Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p>No referred orders yet</p>
          ) : (
            <ul>
              {orders.map(order => (
                <li key={order.id} className="border p-2 my-2">
                  Order #{order.id} — ${order.total} —
                  <span className="text-green-600"> +${(order.total * 0.1).toFixed(2)} commission</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
