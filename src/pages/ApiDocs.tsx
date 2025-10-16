import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo, useEffect, useState } from "react";

const ApiDocs = () => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const [dynamicRoutes, setDynamicRoutes] = useState<
    { method: string; path: string }[]
  >([]);

  const endpoints = useMemo(
    () => [
      {
        group: "Auth",
        routes: ["POST /auth/register", "POST /auth/login", "GET /auth/me"],
      },
      { group: "KYC", routes: ["POST /kyc/submit", "GET /kyc/status"] },
      {
        group: "Documents",
        routes: ["POST /documents/upload", "GET /documents/:id"],
      },
      {
        group: "Invoices",
        routes: ["POST /invoices", "GET /invoices", "GET /invoices/:id"],
      },
      {
        group: "Marketplace",
        routes: ["GET /marketplace", "POST /marketplace/order"],
      },
      {
        group: "Payments",
        routes: ["POST /payments/initiate", "GET /payments/:id"],
      },
      {
        group: "Trading",
        routes: ["GET /trading/orderbook", "POST /trading/order"],
      },
      {
        group: "Analytics",
        routes: ["GET /analytics/summary", "GET /analytics/metrics"],
      },
      {
        group: "Credit Scoring",
        routes: ["POST /credit/score", "GET /credit/score/:id"],
      },
      {
        group: "Blockchain",
        routes: ["GET /blockchain/tx/:hash", "GET /blockchain/status"],
      },
      {
        group: "WebSocket",
        routes: ["WS /ws (events: prices, trades, payments)"],
      },
    ],
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(baseUrl.replace(/\/$/, "").replace("/api", "") + "/api/docs/routes", {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.routes)) setDynamicRoutes(data.routes);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [baseUrl]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
              Developer
            </Badge>
            <h1 className="text-3xl lg:text-5xl font-bold mb-3">
              Fylaro API Documentation
            </h1>
            <p className="text-muted-foreground">
              Base URL: <span className="font-mono">{baseUrl}</span>
            </p>
          </div>

          <Tabs defaultValue="rest" className="w-full">
            <TabsList>
              <TabsTrigger value="rest">REST API</TabsTrigger>
              <TabsTrigger value="ws">WebSocket</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
            </TabsList>

            <TabsContent value="rest" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Discovered Routes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dynamicRoutes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No routes discovered (or backend not running).
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {dynamicRoutes.map((r) => (
                          <li
                            key={r.method + r.path}
                            className="font-mono text-xs text-muted-foreground"
                          >
                            <span className="text-primary font-semibold mr-2">
                              {r.method}
                            </span>
                            {r.path}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                {endpoints
                  .filter((e) => e.group !== "WebSocket")
                  .map((group) => (
                    <Card key={group.group} className="border-border">
                      <CardHeader>
                        <CardTitle>{group.group}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {group.routes.map((r) => (
                            <li
                              key={r}
                              className="font-mono text-sm text-muted-foreground"
                            >
                              {r}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="ws" className="mt-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Realtime via WebSocket</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to{" "}
                    <span className="font-mono">ws://localhost:3001</span> (or
                    your server) and subscribe to events.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {`// JavaScript example (socket.io-client)
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('connected'));
socket.on('prices', (data) => console.log(data));
socket.emit('subscribe', { channel: 'prices' });`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>JWT Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Obtain a token via{" "}
                      <span className="font-mono">POST /auth/login</span>. Send
                      it as
                      <span className="font-mono">
                        {" "}
                        Authorization: Bearer &lt;token&gt;
                      </span>
                      .
                    </p>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                      {`curl -X POST ${baseUrl}/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret"}'`}
                    </pre>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Try it</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <a
                        href="/docs/FINTERNET.md"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read Architecture Docs
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default ApiDocs;
