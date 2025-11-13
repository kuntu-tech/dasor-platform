import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";

const BillingAddMethod = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("US");
  const [postal, setPostal] = useState("");

  const isDisabled = !cardNumber.trim() || !expiry.trim() || !cvc.trim() || !postal.trim();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 text-sm text-muted-foreground">Billing &gt; Payment Methods</div>
      <h1 className="mb-6 text-3xl font-semibold">Add Payment Method</h1>

      <Tabs defaultValue="card" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="card">Card</TabsTrigger>
          <TabsTrigger value="usbank">US Bank Account</TabsTrigger>
          <TabsTrigger value="cashapp">Cash App Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          <div className="space-y-5">
            <div>
              <Label>Card Number</Label>
              <div className="relative mt-2">
                <Input placeholder="1234 1234 1234 1234" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground">VISA • MASTERCARD • AMEX • DISCOVER</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiration Date</Label>
                <Input placeholder="MM/YY" className="mt-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div>
                <Label>Security Code</Label>
                <div className="relative mt-2">
                  <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">123</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country / Region</Label>
                <Select defaultValue={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CN">China</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input className="mt-2" placeholder="12345" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              By providing your card information, you authorize Cursor to charge future payments according to their terms.
            </p>
            <p className="text-xs text-muted-foreground">
              Review Cursor’s service terms and privacy policy for more details.
            </p>

            <div className="pt-2">
              <div className="flex gap-3">
                <Button disabled={isDisabled} className="px-10">Add</Button>
                <Button variant="outline" className="px-10" onClick={() => navigate(-1)}>Back</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="usbank">
          <div className="text-sm text-muted-foreground">Not available yet. Please add a card instead.</div>
        </TabsContent>
        <TabsContent value="cashapp">
          <div className="text-sm text-muted-foreground">Not available yet. Please add a card instead.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAddMethod;


