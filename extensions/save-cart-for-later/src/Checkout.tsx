import {
  reactExtension,
  BlockStack,
  InlineStack,
  Checkbox,
  Button,
  Text,
  useCartLines,
  ChoiceList,
  Choice,
  useApplyCartLinesChange,
  useCustomer
} from "@shopify/ui-extensions-react/checkout";
import { CartLineChange } from "@shopify/ui-extensions/checkout";
import { useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const customer = useCustomer();

  const handleCheckboxChange = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    setError("")
    setSuccess("")
  };

  const handleSaveForLater = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to save for later.');
      return;
    }

    setLoading(true)

    const changes: CartLineChange[] = selectedItems.map((id) => {
      const findProduct = cartLines.find(product => product.id === id)

      if (!findProduct) {
        return;
      }

      return {
        type: 'removeCartLine',
        id,
        quantity: findProduct.quantity,
      }
    });


    try {
      const response = await fetch(`${this.location.origin}/proxy/save-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: selectedItems , customerId : customer.id })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      for (const change of changes.filter(change => change !== undefined)) {
        const result = await applyCartLinesChange(change);
        if (result.type !== 'success') {
          setError('Failed to save items for later. Please try again.');
          return;
        }
      }
      setSuccess('Selected items have been saved for later.');
    } catch (error) {
      console.error('Error saving items for later:', error);
      setError('Failed to save items for later. Please try again.');
    } finally {
      setLoading(false)
    }
  };
  
  return (
    <BlockStack
    accessibilityRole="section"
    >
      <Text size="extraLarge" appearance="info" emphasis="bold">
            Save your cart for later
          </Text>
      <BlockStack
      spacing="loose"
      background="subdued"
      borderRadius="small"
      padding="loose"
      accessibilityRole="section"
      border='base'
      >
      {customer?.id ? ( 
        <>
          {cartLines.length > 0 ? (
            cartLines.map((line) => (
              <InlineStack key={line.id} spacing="tight">
                <ChoiceList
                  name={line.merchandise.title}
                  value={selectedItems}
                  onChange={() => handleCheckboxChange(line.id)}
                >
                  <Choice id={line.id}>{line.merchandise.title}</Choice>
                </ChoiceList>
              </InlineStack>
            ))
          ) : (
            <Text size="small">No items found in your cart.</Text>
          )}
          <BlockStack spacing="none">
            <Button loading={loading} onPress={handleSaveForLater}>
              Save Cart
            </Button>
            {error && <Text appearance="critical">{error}</Text>}
            {success && <Text appearance="success">{success}</Text>}
          </BlockStack>
        </>
      ) : (
        <Text size="large" appearance="warning">
          To save your cart for later, please log in.
        </Text>
      )}
      </BlockStack>
    </BlockStack>
  );
}
