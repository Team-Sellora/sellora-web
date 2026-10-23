import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { RotateCcw, CheckCircle2 } from "lucide-react";
import type { DeliveryDetail } from "@/features/deliveries/types";
import type { CreateReturnResponse } from "../types";
import { RequestReturnDialog } from "./RequestReturnDialog";

interface RequestReturnActionProps {
  delivery: DeliveryDetail;
}

export function RequestReturnAction({ delivery }: Readonly<RequestReturnActionProps>) {
  const { role } = useSelloraAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [createdReturn, setCreatedReturn] = useState<CreateReturnResponse | null>(null);

  const isRoleAllowed = role === "ShopOwner" || role === "SalesRep";
  const isDelivered = delivery.status === "Delivered";
  const hasReturnableStock = delivery.lines?.some((line) => line.returnableQuantity > 0);

  // Visible only when role is ShopOwner/SalesRep, Delivered, and returnableQuantity > 0 left
  if (!isRoleAllowed || !isDelivered || !hasReturnableStock) {
    return null;
  }

  return (
    <>
      <h4 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Returns
      </h4>

      <div className="space-y-3">
        {createdReturn && (
          <div className="rounded-md bg-muted p-4 text-sm border border-border">
            <div className="flex items-center gap-2 text-foreground font-medium mb-1">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>Return request submitted</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Reference:{" "}
              <Link
                to="/returns/$returnId"
                params={{ returnId: createdReturn.returnRequestId }}
                className="font-mono font-semibold text-primary hover:underline"
              >
                {createdReturn.returnReference}
              </Link>
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full sm:w-auto flex items-center gap-2"
          onClick={() => setIsOpen(true)}
        >
          <RotateCcw className="size-4" />
          Request return
        </Button>
      </div>

      <RequestReturnDialog
        deliveryJobId={delivery.id}
        lines={delivery.lines || []}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(created) => setCreatedReturn(created)}
      />
    </>
  );
}
