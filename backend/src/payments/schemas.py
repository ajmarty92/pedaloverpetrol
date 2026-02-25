from pydantic import BaseModel


class CreatePaymentIntentResponse(BaseModel):
    client_secret: str
    amount: int
    currency: str
    mode: str
