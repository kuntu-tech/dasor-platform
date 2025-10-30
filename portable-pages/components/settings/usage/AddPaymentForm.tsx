import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

interface AddPaymentFormProps {
  onBack: () => void;
}

const AddPaymentForm = ({ onBack }: AddPaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("US");
  const [postal, setPostal] = useState("");

  const isDisabled = !cardNumber.trim() || !expiry.trim() || !cvc.trim() || !postal.trim();

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <Tabs defaultValue="card" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="card">Card</TabsTrigger>
          <TabsTrigger value="usbank">US Bank Account</TabsTrigger>
          <TabsTrigger value="cashapp">Cash App Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          <div className="space-y-5">
            <div>
              <Label>Card number</Label>
              <div className="relative mt-2">
                <Input placeholder="1234 1234 1234 1234" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground">
                  VISA • MASTERCARD • AMEX • DISCOVER
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" className="mt-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div>
                <Label>CVC</Label>
                <div className="relative mt-2">
                  <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">123</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country/Region</Label>
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
                <Label>Postal code</Label>
                <Input className="mt-2" placeholder="12345" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              By providing your card, you authorize Cursor to charge future payments per their terms.
            </p>
            <p className="text-xs text-muted-foreground">You can review important information on Cursor’s Terms of Service and Privacy Policy pages.</p>

            <div className="pt-2">
              <div className="flex gap-3">
                <Button disabled={isDisabled} className="px-10">Add</Button>
                <Button variant="outline" className="px-10" onClick={onBack}>Back</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="usbank">
          <div className="text-sm text-muted-foreground">Not available yet. Please use Card.</div>
        </TabsContent>
        <TabsContent value="cashapp">
          <div className="text-sm text-muted-foreground">Not available yet. Please use Card.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddPaymentForm;


