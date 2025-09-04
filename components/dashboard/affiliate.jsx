"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import toast from "react-hot-toast";

export default function Affiliate() {
  const { user } = useAuth();
  const { toast: shadToast } = useToast();
  const [affiliateData, setAffiliateData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/get-affiliate-data?uid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setAffiliateData(data);
        if (data?.code) await loadAffiliateOrders(data.code);
      }
    } catch (e) {
      console.error(e);
      shadToast({ title: "Error", description: "Failed to load affiliate data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateOrders = async (code) => {
    try {
      const res = await fetch(`/api/get-affiliate-orders?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateAffiliateCode = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/generate-affiliate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      if (!res.ok) throw new Error("fail");
      await loadAffiliateData();
      toast.success("Affiliate code generated!");
    } catch {
      toast.error("Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Become an Affiliate</CardTitle>
          <CardDescription>Generate your affiliate code to start earning</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateAffiliateCode} disabled={generating} className="w-full cursor-pointer">
            {generating ? "Generating..." : "Generate Affiliate Code"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const code = affiliateData.code;
  const catalogLink = `https://studentai.in/products?ref=${code}`; // ✅ one link

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Link</CardTitle>
          <CardDescription>You earn <b>10%</b> commission on each sale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{code}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => navigator.clipboard.writeText(code).then(() => toast.success("Code copied!"))}
            >
              Copy Code
            </Button>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Catalog link (share this):</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 break-all">{catalogLink}</code>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => navigator.clipboard.writeText(catalogLink).then(() => toast.success("Link copied!"))}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Performance Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₹{affiliateData.totalCommissions.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Commissions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{affiliateData.totalOrders}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referred Orders</CardTitle>
          <CardDescription>Sales attributed to your link</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border rounded p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">Order #{order.id.slice(-8)}</div>
                      <div className="text-xs text-gray-600">
                        {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{order.total}</div>
                      <div className="text-xs text-green-600">+₹{(order.total * 0.1).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
