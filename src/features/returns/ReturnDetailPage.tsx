import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { Loader2, AlertCircle, Check, X, ArrowLeft } from "lucide-react";
import { Route } from "@/routes/returns_.$returnId";
import { useReturn, useDecideReturn, returnsQueryKey } from "./hooks";
import { ReturnStatusBadge } from "./components/ReturnStatusBadge";
import { RejectReturnDialog } from "./components/RejectReturnDialog";
import { ReturnApiError } from "./types";

export function ReturnDetailPage() {
  const { returnId } = Route.useParams();
  const { role } = useSelloraAuth();
  const queryClient = useQueryClient();

  const query = useReturn(returnId);
  const { mutateAsync: decideReturnMutation, isPending: isDeciding } = useDecideReturn();

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  if (query.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mb-2 size-8 animate-spin" />
        <p className="text-sm">Loading return details…</p>
      </div>
    );
  }

  if (query.isError) {
    const is404 = query.error instanceof ReturnApiError && query.error.status === 404;
    let errorMessage = "Unable to load return details.";
    if (is404) {
      errorMessage = "The requested return does not exist or is outside your scope.";
    } else if (query.error instanceof Error) {
      errorMessage = query.error.message;
    }

    return (
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <AlertCircle className="mx-auto size-10 text-destructive" />
          <h2 className="text-lg font-semibold">
            {is404 ? "Return Request Not Found" : "Error Loading Return"}
          </h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <div className="pt-2">
            <Link
              to="/returns"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-4" /> Back to Shop returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const returnData = query.data;
  if (!returnData) {
    return null;
  }

  const isOperator = role === "AgencyOperator";
  const isRequested = returnData.status === "Requested";
  const canDecide = isOperator && isRequested;

  const handleDecisionError = (err: unknown) => {
    if (err instanceof ReturnApiError) {
      if (err.status === 503) {
        // On 503: stock service unavailable, leave screen exactly as it is for retry
        setDecisionError("Stock service unavailable, try again");
      } else if (err.status === 409) {
        // On 409: already decided or no stock owner; show server detail and refetch
        setDecisionError(err.detail ?? "The return request is no longer pending.");
        queryClient.invalidateQueries({ queryKey: [...returnsQueryKey, returnId] });
      } else {
        setDecisionError(err.detail ?? err.message);
      }
    } else if (err instanceof Error) {
      setDecisionError(err.message);
    }
  };

  const handleApprove = async () => {
    setDecisionError(null);
    try {
      await decideReturnMutation({
        returnId,
        payload: { decision: "Approved" },
      });
    } catch (err) {
      handleDecisionError(err);
    }
  };

  const handleReject = async (reason: string) => {
    setDecisionError(null);
    try {
      await decideReturnMutation({
        returnId,
        payload: { decision: "Rejected", reason },
      });
    } catch (err) {
      handleDecisionError(err);
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        title={`Return ${returnData.returnReference}`}
        description={`For order ${returnData.orderReference} to ${returnData.shopName}`}
        crumbs={[{ label: "Shop returns", to: "/returns" }, { label: returnData.returnReference }]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Returned Lines</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {returnData.lines?.map((line) => (
                    <tr key={line.productId} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{line.productName}</td>
                      <td className="px-4 py-3 text-right font-semibold">{line.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{line.reason}</td>
                    </tr>
                  ))}
                  {(!returnData.lines || returnData.lines.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        No lines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {returnData.status !== "Requested" && (
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Decision Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Outcome</dt>
                  <dd className="font-medium mt-1">
                    <ReturnStatusBadge status={returnData.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Decided by Role</dt>
                  <dd className="font-medium">{returnData.decidedByRole || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Decided at</dt>
                  <dd className="font-medium">
                    {returnData.decidedAt ? new Date(returnData.decidedAt).toLocaleString() : "—"}
                  </dd>
                </div>
                {returnData.decisionReason && (
                  <div>
                    <dt className="text-muted-foreground">Reason</dt>
                    <dd className="font-medium mt-0.5 text-foreground">
                      {returnData.decisionReason}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Status</h3>
            <div className="mb-6">
              <ReturnStatusBadge status={returnData.status} />
            </div>

            {canDecide && (
              <>
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </h4>
                {decisionError && (
                  <div className="mb-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action Failed</AlertTitle>
                      <AlertDescription>{decisionError}</AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isDeciding}
                    className="flex items-center gap-1.5"
                  >
                    {isDeciding && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    <Check className="size-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectOpen(true)}
                    disabled={isDeciding}
                    className="flex items-center gap-1.5 text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Request Details</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Delivery Reference</dt>
                <dd className="font-medium">
                  <Link
                    to="/deliveries/$deliveryId"
                    params={{ deliveryId: returnData.deliveryJobId }}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    View delivery
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Order Reference</dt>
                <dd className="font-medium font-mono text-xs">{returnData.orderReference}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Shop</dt>
                <dd className="font-medium">{returnData.shopName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requested by</dt>
                <dd className="font-medium">{returnData.requestedByRole}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requested at</dt>
                <dd className="font-medium">{new Date(returnData.requestedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <RejectReturnDialog
        isOpen={isRejectOpen}
        isSubmitting={isDeciding}
        onClose={() => setIsRejectOpen(false)}
        onSubmit={handleReject}
      />
    </>
  );
}
