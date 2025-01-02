import {
  PaymentMethod,
  PrismaClient,
  PaymentStatus,
  RoleType,
} from "@prisma/client";
import environment from "dotenv";
import axios from "axios";
import {
  generateTransactionCode,
  generateInvoiceCode,
} from "../../utils/generateUniqueCode";
import {
  createOrder,
  createPayment,
  orderItemInfo,
  orderUserInfo,
} from "../../models/models";
import { MidtransUtils } from "../../utils/midtrans.utils";
import { formatDate } from "../../utils/dateFormatter";

environment.config();

export class PaymentService {
  private serverKey: string;
  private apiURL: string;
  private prisma: PrismaClient;
  private midtransUtils: MidtransUtils;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    this.apiURL = process.env.MIDTRANS_API_URL as string;
    this.prisma = new PrismaClient();
    this.midtransUtils = new MidtransUtils();
  }

  async createOrder(userId: number, subsId: number) {
    let uniqueCode = "";
    let isUniqueCode = false;

    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: true,
        },
      });

      // Check user is available or not
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check is the user is jobhunter
      if (user.role_type !== RoleType.jobhunter) {
        return {
          success: false,
          message: "Subscription can only create by jobhunter",
        };
      }

      // Check if the user is still have subscription or not
      const userSubscription =
        await this.prisma.jobHunterSubscription.findUnique({
          where: {
            job_hunter_subscription_id:
              user.jobHunter[0].jobHunterSubscriptionId,
          },
        });

      if (!userSubscription) {
        return {
          success: false,
          message: "Job hunter didnt have any subscription ID",
        };
      }
      if (userSubscription.subscriptionId !== 1) {
        return {
          success: false,
          message: "User already have an ongoing subscription",
        };
      }

      const subscription = await this.prisma.subscriptionTable.findUnique({
        where: {
          subscription_id: subsId,
        },
      });
      if (!subscription) {
        return {
          success: false,
          message: "Subscription not found",
        };
      }

      do {
        uniqueCode = generateTransactionCode();
        const checkCode = await this.prisma.transaction.findUnique({
          where: {
            invoice_transaction: uniqueCode,
          },
        });
        if (checkCode?.invoice_transaction === uniqueCode) {
          isUniqueCode = false;
        }
        isUniqueCode = true;
      } while (!isUniqueCode);

      console.log("UNIQUEEEE", uniqueCode);

      if (!uniqueCode) {
        return {
          success: false,
          message: "Failed to generate unique ID",
        };
      }

      // Re arrange data
      const data: createOrder = {
        amount: Number(subscription.subscription_price),
        itemInfo: {
          subscriptionId: subscription.subscription_id,
          subscriptionName: subscription.subscription_type,
        },
        userInfo: {
          name: user.jobHunter[0].name,
          email: user.email,
        },
      };

      const midTransReturn = await this.midtransUtils.initOrderMidtrans(
        uniqueCode,
        data.amount,
        data.userInfo,
        data.itemInfo,
      );
      if (midTransReturn.success) {
        const createOrder = await this.prisma.transaction.create({
          data: {
            invoice_transaction: uniqueCode,
            jobHunterId: user.jobHunter[0].job_hunter_id,
            transaction_amount: data.amount,
            created_at: new Date(),
            subscriptionId: data.itemInfo.subscriptionId,
            transaction_status: "pending",
          },
        });
        if (!createOrder) {
          return {
            success: false,
            message: "Failed to create order",
          };
        }
        return {
          success: true,
          data: { transaction: midTransReturn.data, createOrder },
        };
      } else {
        return {
          success: false,
          message: "Failed to create order",
          detail: midTransReturn.data,
        };
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "failed to create order",
      };
    }
  }

  async cancelStatusOrder(userId: number, orderId: string) {}

  async midtransUpdateStatus(paymentData: createPayment) {
    console.log("SERVICE PAYMENT DATA :", paymentData);
    try {
      const checkTransaction = await this.prisma.transaction.findUnique({
        where: {
          invoice_transaction: paymentData.transactionId,
        },
      });
      if (!checkTransaction) {
        return {
          success: false,
          message: "Invalid Order ID",
        };
      }

      // CREATE PAYMENT
      if (paymentData.status === 201) {
        const createPayment = await this.createPayment(
          checkTransaction.transaction_id,
          paymentData,
        );
        if (!createPayment.success) {
          return {
            success: false,
            message: "Failed to create payment",
          };
        }

        console.log("PAYMENT CREATED");
        return {
          success: true,
          message: createPayment.message,
        };
      }

      // UPDATE PAYMENT
      else {
        const updatePayment = await this.updateStatusPayment(
          checkTransaction.jobHunterId,
          checkTransaction.subscriptionId,
          checkTransaction.transaction_id,
          paymentData,
        );
        if (!updatePayment.success) {
          return {
            success: false,
            message: updatePayment.message,
          };
        }
        await this.prisma.transaction.update({
          where: {
            invoice_transaction: paymentData.transactionId,
          },
          data: {
            transaction_status: "success",
          },
        });
        console.log("PAYMENT UPDATED");

        const userTransaction = await this.prisma.transaction.findUnique({
          where: {
            invoice_transaction: paymentData.transactionId,
          },
          include: {
            jobHunter: {
              select: {
                email: true,
                name: true,
                jobHunterSubscription: true,
              },
            },
          },
        });

        return {
          success: true,
          message: "Update Payment",
          data: {
            email: userTransaction?.jobHunter.email,
            name: userTransaction?.jobHunter.name || "Name not available",
            orderId: paymentData.transactionId,
            amount: paymentData.amount,
            packageName:
              userTransaction?.jobHunter.jobHunterSubscription
                .subscriptionId === 2
                ? "Standard Plan"
                : "Professional Plan",
            expirePackage: formatDate(
              userTransaction?.jobHunter.jobHunterSubscription
                .subscription_end_date as Date,
            ),
          },
        };
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "Failed to update order",
      };
    }
  }

  async createPayment(
    transactionId: number,
    paymentData: createPayment,
    pass?: "settlement" | "pending",
  ) {
    let uniqueCode = "";
    let isUniqueCode = false;
    do {
      uniqueCode = generateInvoiceCode();
      const checkCode = await this.prisma.transaction.findUnique({
        where: {
          invoice_transaction: uniqueCode,
        },
      });
      if (checkCode?.invoice_transaction === uniqueCode) {
        isUniqueCode = false;
      }
      isUniqueCode = true;
    } while (!isUniqueCode);

    try {
      const createPayment = await this.prisma.payment.create({
        data: {
          transactionId: transactionId,
          invoice_payment: uniqueCode,
          payment_amount: paymentData.amount,
          payment_date:
            pass === "settlement"
              ? new Date(paymentData.paymentDate)
              : new Date("01/01/1900"), // dummy
          payment_status:
            pass === "settlement"
              ? PaymentStatus.success
              : PaymentStatus.pending,
          payment_method: paymentData.paymentType as PaymentMethod,
          bank:
            paymentData.paymentType === PaymentMethod.bank_transfer
              ? paymentData.bank
              : null,
          created_at: new Date(),
        },
      });

      console.log("CREATE PAYMENT", createPayment);
      return {
        success: true,
        data: createPayment,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to create payment",
      };
    }
  }

  async updateStatusPayment(
    jobHunterId: number,
    subscriptionId: number,
    transactionId: number,
    paymentData: createPayment,
  ) {
    try {
      const checkTransaction = await this.prisma.payment.findFirst({
        where: {
          transactionId: transactionId,
        },
      });

      if (!checkTransaction) {
        return {
          success: false,
          message: "No transaction with that id record in our database",
        };
      }

      await this.prisma.payment.update({
        where: {
          payment_id: checkTransaction.payment_id,
        },
        data: {
          payment_date: new Date(paymentData.paymentDate),
          payment_status: PaymentStatus.success,
          updated_at: new Date(),
        },
      });

      const updateSubscription = await this.updateSubscriptionInfo(
        jobHunterId,
        subscriptionId,
        paymentData.paymentDate,
      );

      if (!updateSubscription.success) {
        return {
          success: false,
          message: updateSubscription.message,
        };
      }

      return {
        success: true,
        message: "update status payment and subscription",
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "Failed to update payment",
      };
    }
  }

  async updateSubscriptionInfo(
    jobhunterId: number,
    subscriptionId: number,
    paymentDate: string,
  ) {
    try {
      const checkUser = await this.prisma.jobHunter.findUnique({
        where: {
          job_hunter_id: jobhunterId,
        },
      });

      if (!checkUser) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const updateSubscription = await this.prisma.jobHunterSubscription.update(
        {
          where: {
            job_hunter_subscription_id: checkUser.jobHunterSubscriptionId,
          },
          data: {
            subscriptionId: subscriptionId,
            subscription_active: true,
            subscription_start_date: new Date(paymentDate),
            subscription_end_date: new Date(
              new Date(paymentDate).getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
            ),
            updated_at: new Date(),
          },
        },
      );
      return {
        success: {
          success: true,
          updateSubscription,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to update subscripton data",
      };
    }
  }

  async verifyPayment(userId: number, orderId: string, verify: string) {
    try {
      const validateUser = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: true,
        },
      });

      if (!validateUser) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const checkTransaction = await this.prisma.transaction.findUnique({
        where: {
          invoice_transaction: orderId,
        },
      });

      if (!checkTransaction) {
        return {
          success: false,
          message: "Order Not Found",
        };
      }

      const verifyOrder =
        await this.midtransUtils.verifyStatusMidtrans(orderId);

      if (!verifyOrder.order_id) {
        return {
          success: false,
          message: verifyOrder.message,
        };
      }

      switch (verify) {
        case "settlement":
          if (
            verifyOrder.transaction_status === "settlement" &&
            checkTransaction.transaction_status === "pending"
          ) {
            const isPaymentExist = await this.prisma.payment.findFirst({
              where: {
                transactionId: checkTransaction.transaction_id,
              },
            });
            if (!isPaymentExist) {
              return {
                success: false,
                message: "Order already has a payment",
              };
            }

            const createPayment = await this.createPayment(
              verifyOrder.order_id,
              {
                paymentDate: verifyOrder.payment_date as string,
                paymentType: verifyOrder.payment_type,
                amount: verifyOrder.payment_amount,
                bank: verifyOrder.bank ? verifyOrder.bank[0].bank : null,
                transactionId: verifyOrder.order_id,
                status: 200,
                paymentStatus: "pending",
              },
              "settlement",
            );

            if (!createPayment.success) {
              return {
                success: false,
                message: "Failed to create payment",
              };
            }

            const updateSubscription = await this.updateSubscriptionInfo(
              validateUser.jobHunter[0].job_hunter_id,
              checkTransaction.subscriptionId,
              verifyOrder.payment_date,
            );

            if (!updateSubscription.success) {
              return {
                success: false,
                message: updateSubscription.message,
              };
            }

            await this.prisma.transaction.update({
              where: {
                transaction_id: checkTransaction.transaction_id,
              },
              data: {
                transaction_status: "success",
              },
            });

            return {
              success: true,
              message: "update status payment and subscription",
              data: verifyOrder.transaction_status,
            };
          } else if (
            verifyOrder.transaction_status === "settlement" &&
            checkTransaction.transaction_status === "success"
          ) {
            return {
              success: true,
              message: "Payment already updated",
              data: verifyOrder.transaction_status,
            };
          } else {
            return {
              success: false,
              message: "Order is not yet settlement",
            };
          }
        case "pending":
          if (
            verifyOrder.transaction_status === "pending" &&
            checkTransaction.transaction_status === "pending"
          ) {
            const isPaymentExist = await this.prisma.payment.findFirst({
              where: {
                transactionId: checkTransaction.transaction_id,
              },
            });
            if (!isPaymentExist) {
              return {
                success: false,
                message: "Order already has a payment",
              };
            }

            await this.midtransUpdateStatus({
              paymentDate: verifyOrder.payment_date as string,
              paymentType: verifyOrder.payment_type,
              amount: verifyOrder.payment_amount,
              bank: verifyOrder.bank ? verifyOrder.bank[0].bank : null,
              transactionId: verifyOrder.order_id,
              status: 201,
              paymentStatus: "pending",
            });
          }

          return {
            success: true,
            message: "Payment already created",
            data: verifyOrder.transaction_status,
          };

        default:
          return {
            success: false,
            message: "Failed to create or update",
          };
      }
    } catch (e) {
      return {
        success: false,
        message: "Failed to create or update",
      };
    }
  }
}
