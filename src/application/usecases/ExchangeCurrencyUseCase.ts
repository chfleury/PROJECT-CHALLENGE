import { inject, injectable } from "inversify";
import {
  ExchangeService,
  ExchangeServiceSymbol,
} from "../../adapters/services/ExchangeService";
import {
  ExchangeCurrencyInput,
  ExchangeCurrencyOutput,
} from "../dtos/ExchangeCurrencyDto";
import { UseCase } from "../utils/UseCase";
import { left, right } from "../utils/Either";
import { Exception } from "../utils/Exception";

@injectable()
export class ExchangeCurrencyUseCase
  implements UseCase<ExchangeCurrencyInput, ExchangeCurrencyOutput>
{
  constructor(
    @inject(ExchangeServiceSymbol) private readonly service: ExchangeService
  ) {}

  async run(input: ExchangeCurrencyInput): Promise<ExchangeCurrencyOutput> {
    try {
      const exchangeRate = await this.service.getExchangeRate(input);

      if (exchangeRate.isLeft()) {
        return left(this.handleServiceError(exchangeRate.value));
      }

      const exchangeResult = this.calculateExchangeResult(
        exchangeRate.value,
        input.amount
      );

      return right({
        exchangeRate: exchangeRate.value,
        exchangeResult: this.formatCurrencyValue(exchangeResult),
      });
    } catch (err) {
      return left({
        kind: "InternalError",
        message: "Something went wrong",
      });
    }
  }

  private handleServiceError(error: Exception): Exception {
    if (error.kind === "unsupported-code") {
      return {
        kind: "unsupported-currency-code",
        message: "The Base or Target currency code is not supported",
      };
    }

    return {
      kind: "internal-server-error",
      message: "Something unexpected happend",
    };
  }

  private calculateExchangeResult(exchangeRate: number, amount: number) {
    return exchangeRate * amount;
  }

  private formatCurrencyValue(amount: number) {
    return amount; // TODO implement
  }
}
