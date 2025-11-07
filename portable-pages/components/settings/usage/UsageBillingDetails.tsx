import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Plus, Search, ChevronDown, ChevronUp, Pencil, Download } from "lucide-react";
import { useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import AddPaymentForm from "./AddPaymentForm";

const subscriptionMock = {
  planName: "Datail Pro",
  price: "US$20.00 / month",
  nextInvoice: "Your next billing date is Nov 15, 2025.",
};

const billingInfoMock = {
  name: "mql",
  email: "gomberglambino@gmail.com",
  addressLines: ["065201", "Beijing City", "District 11", "Suite QQ", "China"],
};

const recordsMock = [
  {
    date: "Oct 15, 2025",
    amount: "US$20.00",
    status: "Paid",
    product: "Datail Pro",
  },
];

type Mode = "overview" | "edit" | "addPayment";

interface UsageBillingDetailsProps {
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
}

const UsageBillingDetails = ({ mode, onModeChange }: UsageBillingDetailsProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [internalMode, setInternalMode] = useState<Mode>("overview");
  const currentMode = mode ?? internalMode;
  const setMode = (m: Mode) => {
    if (onModeChange) onModeChange(m);
    else setInternalMode(m);
  };
  return (
    <div className="mt-8">
      {currentMode === "edit" ? (
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="space-y-6">
            <div>
              <Label>Name</Label>
              <Input defaultValue={billingInfoMock.name} placeholder="Enter your name" className="mt-2" />
            </div>
            <div>
              <Label>Email address</Label>
              <Input defaultValue={billingInfoMock.email} placeholder="name@example.com" className="mt-2" />
            </div>

            <div>
              <Label>Address</Label>
              <div className="mt-2 grid gap-4">
                <Select defaultValue="CN">
                  <SelectTrigger>
                    <SelectValue placeholder="Country/Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CN">China</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>

                <Input defaultValue="065201" placeholder="Postal code" />

                <Select defaultValue="beijing">
                  <SelectTrigger>
                    <SelectValue placeholder="City/Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beijing">Beijing - Beijing Shi</SelectItem>
                    <SelectItem value="shanghai">Shanghai - Shanghai Shi</SelectItem>
                  </SelectContent>
                </Select>

                <Input defaultValue="11" placeholder="Address line 1" />
                <Input defaultValue="11" placeholder="Address line 2" />
                <Input defaultValue="qq" placeholder="Address line 3" />
              </div>
            </div>

            <div>
              <Label>Phone number</Label>
              <div className="mt-2 grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <Select defaultValue="CN">
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CN">CN</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input defaultValue="+86" />
                </div>
                <div className="col-span-7">
                  <Input placeholder="10 1234 5678" />
                </div>
              </div>
            </div>

            <div>
              <Label>Tax ID</Label>
              <div className="mt-2 grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vat">VAT</SelectItem>
                      <SelectItem value="tin">TIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-8">
                  <Input placeholder="ID number" />
                </div>
              </div>
              <button className="mt-3 text-sm text-primary hover:underline">+ Add document</button>
            </div>

            <div className="pt-2">
              <div className="flex gap-3">
                <Button className="px-10" onClick={() => setMode("overview")}>Save</Button>
                <Button variant="outline" onClick={() => setMode("overview")} className="px-10">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      ) : currentMode === "addPayment" ? (
        <AddPaymentForm onBack={() => setMode("overview")} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current subscription</p>
              <Button variant="outline" size="sm">Cancel subscription</Button>
            </div>
            <h3 className="mt-2 text-xl font-semibold">{subscriptionMock.planName}</h3>
            <p className="mt-2 text-lg font-medium">{subscriptionMock.price}</p>
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              aria-expanded={detailsOpen}
            >
              {detailsOpen ? (
                <>Hide details <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show details <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
            {detailsOpen && (
              <div className="mt-3 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Datail Pro</span>
                  <span>US$20.00</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>US$20.00</span>
                </div>
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{subscriptionMock.nextInvoice}</p>
          </div>

          <div className="my-6 border-t border-border" />

          <div>
            <p className="text-sm text-muted-foreground">Payment method</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-10 items-center justify-center rounded-md border border-border bg-background">
                  <div className="relative flex items-center">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
                    <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#F79E1B]" />
                  </div>
                </div>
                <span className="text-sm">MasterCard 2458 **** **** 4478</span>
              </div>
              <span className="text-sm">EUR</span>
            </div>
            <button className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline" onClick={() => setMode("addPayment")}>
              <Plus className="h-4 w-4" /> Add payment method
            </button>
          </div>

          <div className="my-6 border-t border-border" />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Billing information</p>
              <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline" onClick={() => setMode("edit")}>
                <Pencil className="h-4 w-4" /> Edit info
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{billingInfoMock.name}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{billingInfoMock.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing address</p>
                <div className="mt-1 space-y-1">
                  {billingInfoMock.addressLines.slice(0, 3).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Billing history</p>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <div>
                {recordsMock.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm border-b border-border">
                    <div className="col-span-4 text-muted-foreground">{r.date}</div>
                    <div className="col-span-3">{r.amount}</div>
                    <div className="col-span-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">{r.status}</Badge>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <Button variant="ghost" size="icon" aria-label="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageBillingDetails;


