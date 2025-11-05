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
      <div className="mb-6 text-sm text-muted-foreground">Billing &gt; 支付方式</div>
      <h1 className="mb-6 text-3xl font-semibold">添加支付方式</h1>

      <Tabs defaultValue="card" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="card">银行卡</TabsTrigger>
          <TabsTrigger value="usbank">美国银行账户</TabsTrigger>
          <TabsTrigger value="cashapp">Cash App Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          <div className="space-y-5">
            <div>
              <Label>卡号</Label>
              <div className="relative mt-2">
                <Input placeholder="1234 1234 1234 1234" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground">VISA • MASTERCARD • AMEX • DISCOVER</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>有效期</Label>
                <Input placeholder="月/年" className="mt-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div>
                <Label>安全码</Label>
                <div className="relative mt-2">
                  <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">123</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>国家/地区</Label>
                <Select defaultValue={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">美国</SelectItem>
                    <SelectItem value="CN">中国</SelectItem>
                    <SelectItem value="GB">英国</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>邮政编码</Label>
                <Input className="mt-2" placeholder="12345" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">提供您的银行卡信息，即表示您允许 Cursor 按照他们的条款从您的银行卡收取未来款项。</p>
            <p className="text-xs text-muted-foreground">您可以在他们的服务条款和隐私政策页面查看 Cursor 的重要信息。</p>

            <div className="pt-2">
              <div className="flex gap-3">
                <Button disabled={isDisabled} className="px-10">添加</Button>
                <Button variant="outline" className="px-10" onClick={() => navigate(-1)}>返回</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="usbank">
          <div className="text-sm text-muted-foreground">暂未开放，请选择银行卡添加。</div>
        </TabsContent>
        <TabsContent value="cashapp">
          <div className="text-sm text-muted-foreground">暂未开放，请选择银行卡添加。</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAddMethod;


