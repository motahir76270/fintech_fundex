import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator,TextInput,FlatList, Modal, Text, TouchableOpacity, TouchableWithoutFeedback,View } from "react-native";



export const BankSelectionModal = ({ 
  visible, 
  onClose, 
  banks, 
  selectedBank, 
  onSelectBank,
  theme,
  isLoading 
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBanks = useMemo(() => {
    if (searchQuery.trim() === "") {
      return banks;
    }
    return banks.filter((bank: any) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, banks]);

  const handleSelectBank = useCallback((bank: any) => {
    onSelectBank(bank);
    
    setSearchQuery("");
  }, [onSelectBank]);

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery("");
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.modalOverlay,
            justifyContent: "flex-end",
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: theme.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: "80%",
                minHeight: "80%",
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.inputText,
                  }}
                >
                  Select Bank
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={theme.label} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.inputBg,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Ionicons name="search" size={20} color={theme.label} />
                  <TextInput
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 16,
                      color: theme.inputText,
                    }}
                    placeholder="Search bank..."
                    placeholderTextColor={theme.label}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color={theme.label} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Bank List */}
              {isLoading ? (
                <View
                  style={{
                    padding: 32,
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 16,
                      color: theme.label,
                    }}
                  >
                    Loading banks...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item,index:any) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }:any) => (
                    <TouchableOpacity
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor:
                          selectedBank === item.name
                            ? theme.inputBg
                            : "transparent",
                      }}
                      onPress={() => handleSelectBank(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "500",
                            color: theme.inputText,
                            marginBottom: 4,
                          }}
                        >
                          {item.name}
                        </Text>
                        {item.ifscGlobal && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.label,
                            }}
                          >
                            IFSC: {item.ifscGlobal}
                          </Text>
                        )}
                      </View>
                      {selectedBank === item.name && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.success}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View
                      style={{
                        padding: 32,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="business-outline"
                        size={48}
                        color={theme.label}
                      />
                      <Text
                        style={{
                          marginTop: 12,
                          fontSize: 16,
                          color: theme.label,
                          textAlign: "center",
                        }}
                      >
                        No banks found
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};